import * as dotenv from 'dotenv';
import { resolve } from 'path';

// .envファイルをロード
dotenv.config({ path: resolve(__dirname, '../.env') });

// 環境変数を検証して取得する関数
export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`環境変数 ${key} が設定されていません。`);
  }
  return value;
}

// APIキーを取得
export const OPENAI_API_KEY = getEnv('OPENAI_API_KEY')
export const ANTHROPIC_API_KEY = getEnv('ANTHROPIC_API_KEY')
