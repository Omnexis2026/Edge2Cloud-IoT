idf_component_register(
    SRCS "main.c" "burglar_zones.c"
    INCLUDE_DIRS "."
    REQUIRES nvs_flash esp_wifi esp_netif esp_event mqtt driver
)
