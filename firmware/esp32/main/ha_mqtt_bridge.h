#pragma once

#include <stdbool.h>

bool ha_mqtt_ready(void);
void ha_mqtt_publish_telemetry(const char *payload);
