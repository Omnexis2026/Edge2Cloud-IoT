#include "sdkconfig.h"
#include "burglar_zones.h"

#if CONFIG_HA_BURGLAR_ENABLE

#include <stdio.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"
#include "esp_log.h"

#include "ha_mqtt_bridge.h"

static const char *TAG = "ha_burglar";

#define MAX_ZONES 4
#define DEBOUNCE_TICKS 5

static int s_zone_gpio[MAX_ZONES];
static int s_zone_count;
static bool s_stable_secure[MAX_ZONES];
static uint8_t s_debounce[MAX_ZONES];

static void build_zone_table(void)
{
    s_zone_count = 0;
    const int pins[] = {
        CONFIG_HA_ZONE0_GPIO,
        CONFIG_HA_ZONE1_GPIO,
        CONFIG_HA_ZONE2_GPIO,
        CONFIG_HA_ZONE3_GPIO,
    };
    for (int i = 0; i < MAX_ZONES; i++) {
        if (pins[i] >= 0) {
            s_zone_gpio[s_zone_count] = pins[i];
            s_stable_secure[s_zone_count] = true;
            s_debounce[s_zone_count] = 0;
            s_zone_count++;
        }
    }
}

static bool gpio_is_secure(int gpio_num)
{
    /* NC loop to GND: closed = LOW = secure; open = HIGH = alarm */
    return gpio_get_level(gpio_num) == 0;
}

static void publish_zones_json(void)
{
    char buf[256];
    size_t off = 0;
    off += snprintf(buf + off, sizeof(buf) - off, "{\"zones\":[");
    for (int i = 0; i < s_zone_count && off < sizeof(buf) - 8; i++) {
        if (i > 0) {
            off += snprintf(buf + off, sizeof(buf) - off, ",");
        }
        off += snprintf(buf + off, sizeof(buf) - off, "{\"id\":%d,\"ok\":%s}", i,
                        s_stable_secure[i] ? "true" : "false");
    }
    off += snprintf(buf + off, sizeof(buf) - off, "]}");
    if (ha_mqtt_ready()) {
        ha_mqtt_publish_telemetry(buf);
    }
}

static void burglar_task(void *pv)
{
    (void)pv;
    const TickType_t period = pdMS_TO_TICKS(20);

    for (;;) {
        vTaskDelay(period);
        for (int i = 0; i < s_zone_count; i++) {
            int g = s_zone_gpio[i];
            bool secure = gpio_is_secure(g);
            if (secure == s_stable_secure[i]) {
                s_debounce[i] = 0;
                continue;
            }
            s_debounce[i]++;
            if (s_debounce[i] >= DEBOUNCE_TICKS) {
                s_stable_secure[i] = secure;
                s_debounce[i] = 0;
                ESP_LOGI(TAG, "zone %d -> %s", i, secure ? "secure" : "ALARM");
                publish_zones_json();
            }
        }
    }
}

void burglar_zones_init_and_start(void)
{
    build_zone_table();
    if (s_zone_count == 0) {
        ESP_LOGW(TAG, "Burglar enabled but no zones configured (all GPIO -1)");
        return;
    }

    for (int i = 0; i < s_zone_count; i++) {
        int g = s_zone_gpio[i];
        gpio_reset_pin((gpio_num_t)g);
        gpio_set_direction((gpio_num_t)g, GPIO_MODE_INPUT);
        gpio_pullup_en((gpio_num_t)g);
        gpio_pulldown_dis((gpio_num_t)g);
        s_stable_secure[i] = gpio_is_secure(g);
        ESP_LOGI(TAG, "Zone %d on GPIO %d (initially %s)", i, g,
                 s_stable_secure[i] ? "secure" : "ALARM");
    }

    xTaskCreate(burglar_task, "burglar", 4096, NULL, 5, NULL);
}

void burglar_zones_publish_snapshot(void)
{
    if (s_zone_count > 0) {
        publish_zones_json();
    }
}

#else /* !CONFIG_HA_BURGLAR_ENABLE */

void burglar_zones_init_and_start(void) {}

void burglar_zones_publish_snapshot(void) {}

#endif
