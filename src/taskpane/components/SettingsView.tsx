import { useState, useEffect } from "react";
import {
  Button,
  Dropdown,
  Option,
  Input,
  Label,
  makeStyles,
  tokens,
  MessageBar,
  MessageBarBody,
} from "@fluentui/react-components";
import { EyeRegular, EyeOffRegular } from "@fluentui/react-icons";
import { LLMConfig, LLMProvider, AVAILABLE_MODELS } from "../../models/types";

const useStyles = makeStyles({
  container: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    overflowY: "auto",
    height: "100%",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  apiKeyRow: {
    display: "flex",
    gap: "4px",
  },
  apiKeyInput: {
    flex: 1,
  },
  info: {
    fontSize: "12px",
    color: tokens.colorNeutralForeground3,
    lineHeight: "1.4",
  },
  saved: {
    marginTop: "4px",
  },
});

const PROVIDERS: { value: LLMProvider; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google", label: "Google" },
];

interface SettingsViewProps {
  config: LLMConfig | null;
  onConfigChange: (config: LLMConfig) => void;
}

export default function SettingsView({ config, onConfigChange }: SettingsViewProps) {
  const styles = useStyles();
  const [provider, setProvider] = useState<LLMProvider>(config?.provider || "openai");
  const [model, setModel] = useState(config?.model || "");
  const [apiKey, setApiKey] = useState(config?.apiKey || "");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const filteredModels = AVAILABLE_MODELS.filter((m) => m.provider === provider);

  // When provider changes, pick first available model
  useEffect(() => {
    const models = AVAILABLE_MODELS.filter((m) => m.provider === provider);
    if (models.length > 0 && !models.some((m) => m.id === model)) {
      setModel(models[0].id);
    }
  }, [provider, model]);

  const handleSave = () => {
    onConfigChange({ provider, model, apiKey });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.field}>
        <Label htmlFor="provider-select" weight="semibold">
          AI Provider
        </Label>
        <Dropdown
          id="provider-select"
          value={PROVIDERS.find((p) => p.value === provider)?.label || ""}
          onOptionSelect={(_, data) => {
            if (data.optionValue) {
              setProvider(data.optionValue as LLMProvider);
              setSaved(false);
            }
          }}
        >
          {PROVIDERS.map((p) => (
            <Option key={p.value} value={p.value}>
              {p.label}
            </Option>
          ))}
        </Dropdown>
      </div>

      <div className={styles.field}>
        <Label htmlFor="model-select" weight="semibold">
          Model
        </Label>
        <Dropdown
          id="model-select"
          value={filteredModels.find((m) => m.id === model)?.name || ""}
          onOptionSelect={(_, data) => {
            if (data.optionValue) {
              setModel(data.optionValue);
              setSaved(false);
            }
          }}
        >
          {filteredModels.map((m) => (
            <Option key={m.id} value={m.id}>
              {m.name}
            </Option>
          ))}
        </Dropdown>
      </div>

      <div className={styles.field}>
        <Label htmlFor="api-key-input" weight="semibold">
          API Key
        </Label>
        <div className={styles.apiKeyRow}>
          <Input
            id="api-key-input"
            className={styles.apiKeyInput}
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(_, data) => {
              setApiKey(data.value);
              setSaved(false);
            }}
            placeholder="Enter your API key"
          />
          <Button
            appearance="subtle"
            icon={showKey ? <EyeOffRegular /> : <EyeRegular />}
            onClick={() => setShowKey(!showKey)}
            aria-label={showKey ? "Hide API key" : "Show API key"}
          />
        </div>
      </div>

      <Button appearance="primary" onClick={handleSave} disabled={!apiKey}>
        Save Settings
      </Button>

      {saved && (
        <div className={styles.saved}>
          <MessageBar intent="success">
            <MessageBarBody>Settings saved successfully.</MessageBarBody>
          </MessageBar>
        </div>
      )}

      <div className={styles.info}>
        Your API key is stored in this workbook&apos;s document settings and persists
        when the workbook is saved. It is not shared with any third party other than
        the selected AI provider when you use the &quot;Analyze with AI&quot; feature.
      </div>
    </div>
  );
}
