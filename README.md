<h1 align="center">Scoring Pad</h1>

> 快速配置属于你的记分系统

<img alt="Scoring Pad Demo Screeenshot" src="https://github.com/user-attachments/assets/ee489f90-0a79-4884-8849-279674c658e1" />

---

Scoring Pad是一个记分模板，皆在解决课堂记分不方便、排行计算困难等问题。

Scoring Pad使用localStorage本地存储记分数据，由于技术限制原因，暂时没有云端存储版本QWQ如果有大佬会云端存储相关，可以反馈一个issue哦

## 如何配置Scoring Pad

您只需要修改`scoringpad.json`即可修改计分板配置。接下来会逐一讲解修改配置项。

<img alt="image" src="https://github.com/user-attachments/assets/e2869d49-cee2-435b-8f55-fb68bf9fce8c" />

### 1.`login`

该项可以修改为`true`或`false`两个布尔值。它决定了打开计分板时是否需要登录。

> Tip:如果该值修改为`false`，则`username`和`password`两个值不起效。

### 2.`username`和`password`

顾名思义，他们两个值配置了登录页面的正确用户名与密码。只有在登录时正确输入这两个值配置的用户名与密码才能进入计分板页面。

