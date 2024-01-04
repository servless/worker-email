# 邮件过滤处理

CloudFlare 邮箱转发（`Catch-all`）过滤规则服务。

## 特征

- 支持收件人白名单
- 支持多邮箱发件人白名单
- 支持多邮箱发件人黑名单
- 支持指定发件人域名黑名单
- 支持邮件标题过滤

## 部署教程

### 通过 GitHub Actions 发布至 CloudFlare

1. 从 CloudFlare 获取 `CLOUDFLARE_API_TOKEN` 值，并设置到项目。

   > `https://github.com/<ORG>/<REPO>/settings/secrets/actions`

2. **可选**）设置`别名`。创建 `KV`、，并绑定到此 Workers 服务。
   - 2.1a 手动后台绑定，（`Settings` -> `Variables` -> `KV Namespace Bindings` -> `Add binding` -> `Variable name (data)`, `选择创建的 KV`）
   - 2.1b 通过命令行创建。按照**本地部署**的第 6 步，创建和保存 `KV`

### 本地部署到 CloudFlare

1.  注册 [CloudFlare 账号](https://www.cloudflare.com/)，并且设置 **Workers** 域名 (比如：`xxx.workers.dev`)

2.  安装 [Wrangler 命令行工具](https://developers.cloudflare.com/workers/wrangler/)。
    ```bash
     npm install -g wrangler
    ```
3.  登录 `Wrangler`（可能需要扶梯）：

    ```bash
    # 若登录不成功，可能需要使用代理。
    wrangler login
    ```

4.  拉取本项目,并进入该项目目录：

    ```bash
    git clone https://github.com/servless/worker-email.git
    cd worker-email
    ```

5.  修改 `wrangler.toml` 文件中的 `name`（proj）为服务名 `xxx`（访问域名为：`proj.xxx.workers.dev`）

6.  创建 **Workers** 和 **KV**，并绑定 `KV` 到 `Workers`

    1.  **创建 KV，并设置 email 对象值**

        创建名为 `data` 的 `namespace`

        ```bash
           wrangler kv:namespace create data
        ```

        得到

        ```bash
        		⛅️ wrangler 2.19.0
        		--------------------
        		🌀 Creating namespace with title "email-data"
        		✨ Success!
        		Add the following to your configuration file in your kv_namespaces array:
        		{ binding = "data", id = "2870141d9f274c6db12d170e01e0b953" }
        ```

        将上述命令得到的 `kv_namespaces` 保存到 `wrangler.toml` 中，即

        ```bash
           # 替换当前项目该文件内相关的数据，即只需要将 id 的值替换为上一步骤得到的值
           kv_namespaces = [
           { binding = "data", id = "2870141d9f274c6db12d170e01e0b953" }
           ]
        ```

    2.  设置邮箱相关值

        - 1. 设置接收邮箱
             **注意：** 此邮箱必须已经在 CloudFlare 通过验证。

          ```bash
          # json 格式
          wrangler kv:key put --binding=data 'forward' 'dest@email.com'
          ```

        - 2. 收件人白名单列表
             设置后，若收件人不在白名单中，则会立即拒收件，不会执行后续规则的检测。

          ```bash
          # json 格式
          wrangler kv:key put --binding=data 'target' '["me@myemail.com"]'
          ```

        - 3. 发件人白名单列表
             设置后，若发件人不在白名单中，则会立即拒收件，不会执行后续规则的检测。

          ```bash
          # json 格式
          wrangler kv:key put --binding=data 'allow' '["ex1@email.com"]'
          ```

        - 4. 发件人黑名单列表

          ```bash
          wrangler kv:key put --binding=data 'block' '["ex1@email.com","ex2@email.com"]'
          ```

        - 5. 发件人黑名单域名列表

          ```bash
          wrangler kv:key put --binding=data 'block_domains' '["abc.com","block.com"]'
          ```

        - 6. `Subject` 过滤词列表

          ```bash
          wrangler kv:key put --binding=data 'filter_words' '["财务"]'
          ```

7.  发布

    ```bash
     wrangler deploy
    ```

    发布成功将会显示对应的网址

    ```bash
    Proxy environment variables detected. We'll use your proxy for fetch requests.
    ⛅️ wrangler 2.19.0
    --------------------
    Your worker has access to the following bindings:
    - KV Namespaces:
    	- data: 2870141d9f274c6db12d170e01e0b953
    Total Upload: 0.90 KiB / gzip: 0.37 KiB
    Uploaded email (0.87 sec)
    Published email (3.85 sec)
    	https://email.xxx.workers.dev
    Current Deployment ID: 85d498d5-57c7-4970-8844-e5057a3d29f7
    ```

8.  在`指定的域名` -> `Email` -> `Email Routing` -> `Routes` -> `Catch-all address` -> `Edit` -> `Action` (`Send to A Worker`), `Destination` (`email`，该 Worker 服务)

9.  设置目标邮箱（按第 8 步，在 `Routes` 中），`Destination addresses` -> `Add destination address` 添加收件箱地址。

## 仓库镜像

- https://git.jetsung.com/servless/worker-email
- https://framagit.org/servless/worker-email
- https://github.com/servless/worker-email
