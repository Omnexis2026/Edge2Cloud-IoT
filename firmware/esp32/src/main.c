#include <stdio.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_event.h"
#include "esp_log.h"
#include "esp_mac.h"
#include "esp_timer.h"
#include "esp_netif.h"
#include "esp_wifi.h"
#include "esp_wifi_default.h"
#include "mqtt_client.h"
#include "nvs_flash.h"

#include "sdkconfig.h"

static const char *TAG = "ha_esp";

static esp_mqtt_client_handle_t s_mqtt;
static bool s_mqtt_started;

static char s_device_id[13];
static char s_topic_cmd[96];
static char s_topic_state[96];
static char s_topic_telemetry[96];

static void build_topics(void)
{
    uint8_t mac[6];
    esp_read_mac(mac, ESP_MAC_WIFI_STA);
    snprintf(s_device_id, sizeof(s_device_id), "%02x%02x%02x%02x%02x%02x",
             mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);

    const char *home = CONFIG_HA_HOME_ID;
    snprintf(s_topic_cmd, sizeof(s_topic_cmd), "home/%s/device/%s/command", home, s_device_id);
    snprintf(s_topic_state, sizeof(s_topic_state), "home/%s/device/%s/state", home, s_device_id);
    snprintf(s_topic_telemetry, sizeof(s_topic_telemetry), "home/%s/device/%s/telemetry", home, s_device_id);
}

static void mqtt_event_handler(void *handler_args, esp_event_base_t base, int32_t event_id, void *event_data)
{
    esp_mqtt_event_handle_t event = event_data;
    esp_mqtt_client_handle_t client = event->client;

    switch ((esp_mqtt_event_id_t)event_id) {
    case MQTT_EVENT_CONNECTED:
        ESP_LOGI(TAG, "MQTT connected");
        esp_mqtt_client_subscribe(client, s_topic_cmd, 0);
        esp_mqtt_client_publish(client, s_topic_state, "{\"online\":true}", 0, 1, 1);
        break;
    case MQTT_EVENT_DISCONNECTED:
        ESP_LOGW(TAG, "MQTT disconnected");
        break;
    case MQTT_EVENT_DATA:
        ESP_LOGI(TAG, "MQTT data topic=%.*s payload=%.*s",
                 event->topic_len, event->topic, event->data_len, event->data);
        break;
    default:
        break;
    }
}

static void mqtt_start(void)
{
    if (s_mqtt_started) {
        return;
    }

    esp_mqtt_client_config_t cfg = {
        .broker.address.uri = CONFIG_HA_MQTT_BROKER_URI,
        .credentials.username = CONFIG_HA_MQTT_USERNAME,
        .credentials.authentication.password = CONFIG_HA_MQTT_PASSWORD,
    };

    s_mqtt = esp_mqtt_client_init(&cfg);
    if (s_mqtt == NULL) {
        ESP_LOGE(TAG, "esp_mqtt_client_init failed");
        return;
    }
    esp_mqtt_client_register_event(s_mqtt, ESP_EVENT_ANY_ID, mqtt_event_handler, NULL);
    esp_err_t err = esp_mqtt_client_start(s_mqtt);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "esp_mqtt_client_start: %s", esp_err_to_name(err));
        return;
    }
    s_mqtt_started = true;
}

static void wifi_event_handler(void *arg, esp_event_base_t event_base, int32_t event_id, void *event_data)
{
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START) {
        esp_wifi_connect();
    } else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED) {
        ESP_LOGW(TAG, "Wi‑Fi disconnected, reconnecting");
        esp_wifi_connect();
    } else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
        ip_event_got_ip_t *event = (ip_event_got_ip_t *)event_data;
        ESP_LOGI(TAG, "Got IP: " IPSTR, IP2STR(&event->ip_info.ip));
        mqtt_start();
    }
}

static void telemetry_task(void *pv)
{
    (void)pv;
    const TickType_t interval = pdMS_TO_TICKS(30000);

    for (;;) {
        vTaskDelay(interval);
        if (s_mqtt_started && s_mqtt) {
            char buf[64];
            snprintf(buf, sizeof(buf), "{\"uptime_ms\":%llu}",
                     (unsigned long long)(esp_timer_get_time() / 1000));
            esp_mqtt_client_publish(s_mqtt, s_topic_telemetry, buf, 0, 1, 0);
        }
    }
}

void app_main(void)
{
    esp_err_t err = nvs_flash_init();
    if (err == ESP_ERR_NVS_NO_FREE_PAGES || err == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        err = nvs_flash_init();
    }
    ESP_ERROR_CHECK(err);

    build_topics();
    ESP_LOGI(TAG, "MQTT topics: %s / %s / %s", s_topic_cmd, s_topic_state, s_topic_telemetry);

    if (strlen(CONFIG_HA_WIFI_SSID) == 0) {
        ESP_LOGE(TAG, "HA_WIFI_SSID is empty — set WiFi in menuconfig (pio run -t menuconfig) or sdkconfig");
        return;
    }

    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_create_default_wifi_sta();

    wifi_init_config_t wcfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&wcfg));

    ESP_ERROR_CHECK(esp_event_handler_register(WIFI_EVENT, ESP_EVENT_ANY_ID, &wifi_event_handler, NULL));
    ESP_ERROR_CHECK(esp_event_handler_register(IP_EVENT, IP_EVENT_STA_GOT_IP, &wifi_event_handler, NULL));

    wifi_config_t wifi_config = { 0 };
    snprintf((char *)wifi_config.sta.ssid, sizeof(wifi_config.sta.ssid), "%s", CONFIG_HA_WIFI_SSID);
    snprintf((char *)wifi_config.sta.password, sizeof(wifi_config.sta.password), "%s",
             CONFIG_HA_WIFI_PASSWORD);
    wifi_config.sta.threshold.authmode = WIFI_AUTH_WPA2_PSK;

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_config));
    ESP_ERROR_CHECK(esp_wifi_start());

    xTaskCreate(telemetry_task, "telemetry", 4096, NULL, 5, NULL);
}
