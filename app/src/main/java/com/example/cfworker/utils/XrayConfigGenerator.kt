package com.example.cfworker.utils

object XrayConfigGenerator {

    fun buildVlessWsConfig(host: String, path: String, uuid: String): String {
        return """
        {
          "log": {
            "loglevel": "warning"
          },
          "inbounds": [
            {
              "port": 10808,
              "protocol": "socks",
              "settings": {
                "auth": "noauth",
                "udp": true
              },
              "sniffing": {
                "enabled": true,
                "destOverride": ["http", "tls"]
              }
            }
          ],
          "outbounds": [
            {
              "protocol": "vless",
              "settings": {
                "vnext": [
                  {
                    "address": "$host",
                    "port": 443,
                    "users": [
                      {
                        "id": "$uuid",
                        "encryption": "none"
                      }
                    ]
                  }
                ]
              },
              "streamSettings": {
                "network": "ws",
                "security": "tls",
                "tlsSettings": {
                  "serverName": "$host",
                  "allowInsecure": false
                },
                "wsSettings": {
                  "path": "$path",
                  "headers": {
                    "Host": "$host"
                  }
                }
              }
            }
          ]
        }
        """.trimIndent()
    }
}
