基于您提供的代码文件，特别是 `src/index.js`、`docs/APIDoc.md` 和各个 ConfigBuilder 文件，我为您整理了详细的 API 接口文档。

这份文档专为程序调用设计，包含了所有支持的参数和数据结构。

# Sublink Worker API 接口文档

## 1\. 基础说明

  - **Base URL**: `https://<你的Worker域名>`
  - **请求方式**: 推荐使用 `GET` (转换配置) 和 `POST` (保存配置)。
  - **编码**: 所有 URL 参数值（尤其是 `config`、`customRules` 等）必须经过 URL Encode 编码。

-----

## 2\. 核心转换接口

用于将原始订阅链接转换为特定客户端的配置文件。

### 接口地址

  - **Sing-Box**: `/singbox`
  - **Clash**: `/clash`
  - **Surge**: `/surge`
  - **Xray**: `/xray` (仅进行简单的 Base64 解码和合并)

### 请求参数 (Query Parameters)

| 参数名 | 必填 | 类型 | 默认值 | 描述 |
| :--- | :---: | :--- | :--- | :--- |
| `config` | **是** | String | - | **核心参数**。原始订阅链接或配置内容。支持多个链接用换行符 `\n` 分隔。需 URL 编码。 |
| `ua` | 否 | String | `curl/7.74.0` | 请求原始订阅时使用的 User-Agent。 |
| `lang` | 否 | String | `zh-CN` | 生成配置中注释或名称的语言。支持 `zh-CN`, `en-US`, `fa`, `ru`。 |
| `selectedRules` | 否 | String | `minimal` | 预定义规则集名称（如 `balanced`）或规则名称的 JSON 数组字符串。 |
| `customRules` | 否 | String | `[]` | 自定义规则的 JSON 数组字符串。详见下方数据结构。 |
| `group_by_country`| 否 | Boolean| `false` | 是否将节点按国家分组（生成策略组）。传值为 `true` 开启。 |
| `configId` | 否 | String | - | 使用之前通过 `/config` 接口保存的基础配置模板 ID。 |

#### Clash / Sing-Box 专属高级参数

以下参数主要用于开启 Clash API 支持（方便使用面板）：

| 参数名 | 适用客户端 | 描述 |
| :--- | :--- | :--- |
| `enable_clash_ui` | Clash, Singbox | `true` 开启 Clash API 支持。 |
| `external_controller`| Clash, Singbox | 自定义外部控制器地址，例如 `0.0.0.0:9090`。 |
| `external_ui_download_url`| Clash, Singbox | 自定义 Dashboard UI 的下载地址。 |

### 响应内容

  - **Content-Type**:
      - Sing-Box: `application/json`
      - Clash: `text/yaml`
      - Surge/Xray: `text/plain`
  - **Body**: 转换后的完整配置文件内容。

-----

## 3\. 辅助功能接口

### 3.1 短链接生成

将长 URL 转换为短链接。

  - **URL**: `/shorten`
  - **Method**: `GET`
  - **参数**: `url` (原始长链接)
  - **响应**:
    ```json
    { "shortUrl": "https://<domain>/s/<id>" }
    ```

### 3.2 保存基础配置

上传自定义的基础配置模板（如自定义的 DNS、Inbounds 等），返回一个 ID 供转换时使用。

  - **URL**: `/config`
  - **Method**: `POST`
  - **Headers**: `Content-Type: application/json`
  - **Body**:
    ```json
    {
      "type": "singbox",  // 或 "clash"
      "content": "..."    // JSON 字符串或 YAML 字符串
    }
    ```
  - **响应**: `String` (配置 ID，例如 `singbox_a1b2c3d4`)

-----

## 4\. 数据结构详解

### 4.1 `selectedRules` (预定义规则)

可以是以下字符串之一，也可以是规则名称的 JSON 数组：

  - `minimal`: 包含 Location:CN, Private, Non-China
  - `balanced`: 包含 minimal 加上 Google, Youtube, Github, AI Services, Telegram
  - `comprehensive`: 包含所有可用规则。

**可用规则名称列表**:
`Ad Block`, `AI Services`, `Bilibili`, `Youtube`, `Google`, `Private`, `Location:CN`, `Telegram`, `Github`, `Microsoft`, `Apple`, `Social Media`, `Streaming`, `Gaming`, `Education`, `Financial`, `Cloud Services`, `Non-China`.

### 4.2 `customRules` (自定义规则)

这是一个 JSON 对象的数组，序列化为字符串后传入。自定义规则会被置顶。

**JSON 结构示例**:

```json
[
  {
    "name": "我的自定义规则",
    "site": "google,anthropic",        // Geo-Site 规则，逗号分隔
    "ip": "private,cn",                // Geo-IP 规则，逗号分隔
    "domain_suffix": ".com,.org",      // 域名后缀
    "domain_keyword": "keyword",       // 域名关键字
    "ip_cidr": "10.0.0.0/8",           // IP CIDR
    "protocol": "http,ssh"             // 协议类型 (Sing-Box专用)
  }
]
```

-----

## 5\. 调用示例 (Python)

```python
import requests
import json
import urllib.parse

base_url = "https://your-worker.workers.dev"

# 1. 准备参数
source_url = "vmess://......\nss://......" # 原始订阅
custom_rules = [
    {
        "name": "Company Direct",
        "domain_suffix": "company.com",
        "site": "google"
    }
]

params = {
    "config": source_url,
    "ua": "clash.meta",
    "selectedRules": "balanced", # 使用平衡规则集
    "customRules": json.dumps(custom_rules), # 自定义规则需转为JSON字符串
    "group_by_country": "true",
    "lang": "zh-CN"
}

# 2. 发起 Sing-Box 转换请求
# 注意：requests 库会自动处理 URL 编码
response = requests.get(f"{base_url}/singbox", params=params)

if response.status_code == 200:
    print("转换成功!")
    print(response.text) # 输出 JSON 配置
else:
    print(f"转换失败: {response.status_code}")
    print(response.text)
```