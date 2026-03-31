import { Component, Show } from "solid-js"
import { Button } from "@opencode-ai/ui/button"
import { Select } from "@opencode-ai/ui/select"
import { TextField } from "@opencode-ai/ui/text-field"
import { useLanguage } from "@/context/language"
import { usePlatform } from "@/context/platform"
import { useSettings } from "@/context/settings"
import { SettingsList } from "./settings-list"

interface SettingsRowProps {
  title: string
  description: string
  children: any
}

const SettingsRow: Component<SettingsRowProps> = (props) => {
  return (
    <div class="flex flex-wrap items-center gap-4 py-3 border-b border-border-weak-base last:border-none sm:flex-nowrap">
      <div class="flex min-w-0 flex-1 flex-col gap-0.5">
        <span class="text-14-medium text-text-strong">{props.title}</span>
        <span class="text-12-regular text-text-weak">{props.description}</span>
      </div>
      <div class="flex w-full justify-end sm:w-auto sm:shrink-0">{props.children}</div>
    </div>
  )
}

export const SettingsSite: Component = () => {
  const language = useLanguage()
  const platform = usePlatform()
  const settings = useSettings()

  const connectionTypeOptions = [
    { value: "local" as const, label: language.t("settings.site.connectionType.local") },
    { value: "ssh" as const, label: language.t("settings.site.connectionType.ssh") },
  ]

  const authTypeOptions = [
    { value: "password" as const, label: language.t("settings.site.ssh.authType.password") },
    { value: "privateKey" as const, label: language.t("settings.site.ssh.authType.privateKey") },
  ]

  const browse = async () => {
    const result = await platform.openDirectoryPickerDialog?.()
    if (result && !Array.isArray(result)) {
      settings.site.setLocalPath(result)
    }
  }

  const testConnection = () => {
    // SSH adapter is a stub - this will be functional once implemented
    const type = settings.site.connectionType()
    if (type === "local") {
      console.log("Testing local connection at:", settings.site.localPath())
    } else {
      console.log("Testing SSH connection:", {
        host: settings.site.ssh.host(),
        port: settings.site.ssh.port(),
        username: settings.site.ssh.username(),
        authType: settings.site.ssh.authType(),
        privateKeyPath: settings.site.ssh.privateKeyPath(),
        remotePath: settings.site.ssh.remotePath(),
      })
    }
  }

  return (
    <div class="flex flex-col h-full overflow-y-auto no-scrollbar px-4 pb-10 sm:px-10 sm:pb-10">
      <div class="sticky top-0 z-10 bg-[linear-gradient(to_bottom,var(--surface-stronger-non-alpha)_calc(100%_-_24px),transparent)]">
        <div class="flex flex-col gap-1 pt-6 pb-8">
          <h2 class="text-16-medium text-text-strong">{language.t("settings.site.title")}</h2>
        </div>
      </div>

      <div class="flex flex-col gap-8 w-full">
        <div class="flex flex-col gap-1">
          <h3 class="text-14-medium text-text-strong pb-2">{language.t("settings.site.section.connection")}</h3>

          <SettingsList>
            <SettingsRow
              title={language.t("settings.site.row.connectionType.title")}
              description={language.t("settings.site.row.connectionType.description")}
            >
              <Select
                data-action="settings-site-connection-type"
                options={connectionTypeOptions}
                current={connectionTypeOptions.find((o) => o.value === settings.site.connectionType())}
                value={(o) => o.value}
                label={(o) => o.label}
                onSelect={(option) => option && settings.site.setConnectionType(option.value)}
                variant="secondary"
                size="small"
                triggerVariant="settings"
              />
            </SettingsRow>
          </SettingsList>
        </div>

        <Show when={settings.site.connectionType() === "local"}>
          <div class="flex flex-col gap-1">
            <h3 class="text-14-medium text-text-strong pb-2">{language.t("settings.site.section.local")}</h3>

            <SettingsList>
              <SettingsRow
                title={language.t("settings.site.row.localPath.title")}
                description={language.t("settings.site.row.localPath.description")}
              >
                <div class="flex gap-2">
                  <div class="w-full sm:w-[300px]">
                    <TextField
                      data-action="settings-site-local-path"
                      label={language.t("settings.site.row.localPath.title")}
                      hideLabel
                      type="text"
                      value={settings.site.localPath()}
                      onChange={(value) => settings.site.setLocalPath(value)}
                      placeholder={language.t("settings.site.row.localPath.placeholder")}
                      spellcheck={false}
                      class="text-12-regular"
                    />
                  </div>
                  <Button size="small" variant="secondary" onClick={browse}>
                    {language.t("settings.site.action.browse")}
                  </Button>
                </div>
              </SettingsRow>
            </SettingsList>
          </div>
        </Show>

        <Show when={settings.site.connectionType() === "ssh"}>
          <div class="flex flex-col gap-1">
            <h3 class="text-14-medium text-text-strong pb-2">{language.t("settings.site.section.ssh")}</h3>

            <SettingsList>
              <SettingsRow
                title={language.t("settings.site.row.host.title")}
                description={language.t("settings.site.row.host.description")}
              >
                <div class="w-full sm:w-[300px]">
                  <TextField
                    data-action="settings-site-ssh-host"
                    label={language.t("settings.site.row.host.title")}
                    hideLabel
                    type="text"
                    value={settings.site.ssh.host()}
                    onChange={(value) => settings.site.ssh.setHost(value)}
                    placeholder="example.com"
                    spellcheck={false}
                    class="text-12-regular"
                  />
                </div>
              </SettingsRow>

              <SettingsRow
                title={language.t("settings.site.row.port.title")}
                description={language.t("settings.site.row.port.description")}
              >
                <div class="w-full sm:w-[120px]">
                  <TextField
                    data-action="settings-site-ssh-port"
                    label={language.t("settings.site.row.port.title")}
                    hideLabel
                    type="text"
                    value={String(settings.site.ssh.port())}
                    onChange={(value) => settings.site.ssh.setPort(parseInt(value) || 22)}
                    placeholder="22"
                    spellcheck={false}
                    class="text-12-regular"
                  />
                </div>
              </SettingsRow>

              <SettingsRow
                title={language.t("settings.site.row.username.title")}
                description={language.t("settings.site.row.username.description")}
              >
                <div class="w-full sm:w-[200px]">
                  <TextField
                    data-action="settings-site-ssh-username"
                    label={language.t("settings.site.row.username.title")}
                    hideLabel
                    type="text"
                    value={settings.site.ssh.username()}
                    onChange={(value) => settings.site.ssh.setUsername(value)}
                    placeholder="user"
                    spellcheck={false}
                    class="text-12-regular"
                  />
                </div>
              </SettingsRow>

              <SettingsRow
                title={language.t("settings.site.row.authType.title")}
                description={language.t("settings.site.row.authType.description")}
              >
                <Select
                  data-action="settings-site-ssh-auth-type"
                  options={authTypeOptions}
                  current={authTypeOptions.find((o) => o.value === settings.site.ssh.authType())}
                  value={(o) => o.value}
                  label={(o) => o.label}
                  onSelect={(option) => option && settings.site.ssh.setAuthType(option.value)}
                  variant="secondary"
                  size="small"
                  triggerVariant="settings"
                />
              </SettingsRow>

              <Show when={settings.site.ssh.authType() === "password"}>
                <SettingsRow
                  title={language.t("settings.site.row.password.title")}
                  description={language.t("settings.site.row.password.description")}
                >
                  <div class="w-full sm:w-[200px]">
                    <TextField
                      data-action="settings-site-ssh-password"
                      label={language.t("settings.site.row.password.title")}
                      hideLabel
                      type="password"
                      value={settings.site.ssh.password() ?? ""}
                      onChange={(value) => settings.site.ssh.setPassword(value)}
                      placeholder={language.t("settings.site.row.password.placeholder")}
                      spellcheck={false}
                      class="text-12-regular"
                    />
                  </div>
                </SettingsRow>
              </Show>

              <Show when={settings.site.ssh.authType() === "privateKey"}>
                <SettingsRow
                  title={language.t("settings.site.row.privateKeyPath.title")}
                  description={language.t("settings.site.row.privateKeyPath.description")}
                >
                  <div class="w-full sm:w-[300px]">
                    <TextField
                      data-action="settings-site-ssh-private-key-path"
                      label={language.t("settings.site.row.privateKeyPath.title")}
                      hideLabel
                      type="text"
                      value={settings.site.ssh.privateKeyPath()}
                      onChange={(value) => settings.site.ssh.setPrivateKeyPath(value)}
                      placeholder="~/.ssh/id_rsa"
                      spellcheck={false}
                      class="text-12-regular"
                    />
                  </div>
                </SettingsRow>
              </Show>

              <SettingsRow
                title={language.t("settings.site.row.remotePath.title")}
                description={language.t("settings.site.row.remotePath.description")}
              >
                <div class="w-full sm:w-[300px]">
                  <TextField
                    data-action="settings-site-ssh-remote-path"
                    label={language.t("settings.site.row.remotePath.title")}
                    hideLabel
                    type="text"
                    value={settings.site.ssh.remotePath()}
                    onChange={(value) => settings.site.ssh.setRemotePath(value)}
                    placeholder="/var/www/html"
                    spellcheck={false}
                    class="text-12-regular"
                  />
                </div>
              </SettingsRow>
            </SettingsList>
          </div>
        </Show>

        <div class="flex flex-col gap-1">
          <div class="flex gap-2 pt-4">
            <Button size="small" variant="secondary" onClick={testConnection}>
              {language.t("settings.site.action.testConnection")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
