# MISSION - ScaletoTop (STP2026) 上线冲刺黑匣子

## 🎯 核心使命 (Mission Statement)
**目标：** 实现 STP2026 1.0 版本的完整上线。
**要求：** 必须跑通从“用户注册”到“工具使用”的全链路，并完成高标准的 UI/UX 细节优化。

## 🚀 当前状态报告 (Status Report) - 2026-02-10
- **基础设施：** Contabo VPS 已就绪，Coolify 控制面板已解析 (`cool.scaletotop.com`)。
- **环境配置：** `.env` 密钥已全量更新，本地记忆引擎已切换为 Local 模式。
- **核心代码：** 已合并至 `main` 分支。

## 🛠 关键任务清单 (The Launch Checklist)

### 1. 认证全流程跑通 (Critical Path)
- [ ] **Resend 发信实测**：验证 `jack@scaletotop.com` 是否能突破沙盒限制发送验证码。
- [ ] **注册逻辑校验**：模拟新用户与老用户，确保“渐进式注册”流程无死角。

### 2. 自动化运维部署 (DevOps)
- [ ] **Dockerfile 编写**：优化 STP2026 的构建镜像，确保在 154.12.243.94 稳定运行。
- [ ] **Coolify 关联**：实现 GitHub `main` 分支推送后自动触发全量部署。

### 3. UI/UX 与细节优化 (Polishing)
- [ ] **文案去技术化**：再次扫描全站，确保没有遗留的“Better Auth”或内部开发术语。
- [ ] **性能巡检**：优化 Dashboard 首页的加载速度，确保营销工具箱秒开。

## ⚠️ 障碍与已知 Bug (Obstacles & Bugs)
- **403/503 幽灵**：注意网络链路波动对 Webhook 的影响。
- **Resend 域名未验证**：目前仅限测试发信，需尽快完成域名 DNS 验证。

## 📋 下一步行动计划 (Next Immediate Actions)
1. **[杰克]** 确认是否已在 Coolify 注册账号。
2. **[阿拉丁]** 准备执行 Resend 发信测试脚本，向杰克邮箱发送测试。
3. **[阿拉丁]** 编写 STP2026 的部署配置文件。

---
*注：每当开始工作前，我将优先读取此文件以恢复任务上下文。*
