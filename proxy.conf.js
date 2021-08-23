const PROXY_CONFIG = [
    {
        context: [
            "/oauth/2.0",
        ],
        target: "https://openapi.baidu.com",
        changeOrigin: true
    },
    {
        context: [
            "/rest/2.0",
        ],
        target: "https://pan.baidu.com",
        changeOrigin: true
    }
]

module.exports = PROXY_CONFIG;