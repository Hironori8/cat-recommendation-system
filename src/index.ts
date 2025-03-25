import { ChatAnthropic } from "@langchain/anthropic";
import {AgentExecutor} from "langchain/agents";
import * as dotenv from "dotenv";
import {ANTHROPIC_API_KEY} from "./config";
import { DataSource } from "typeorm";
import {SqlDatabase} from "langchain/sql_db";
import { createSqlAgent, SqlToolkit } from "langchain/agents/toolkits/sql";

// 環境変数の読み込み
dotenv.config();

// 猫データベースのインターフェース
interface Cat {
  id: number;
  name: string;
  breed: string;
  age: number;
  gender: string;
  size: string;
  temperament: string;
  energy_level: string;
  grooming_needs: string;
  good_with_children: boolean;
  good_with_other_pets: boolean;
  special_needs: string | null;
  description: string;
}

// データベーススキーマ情報
const CAT_DB_SCHEMA = `
CREATE TABLE cats (
    id INTEGER PRIMARY KEY,
    name TEXT,
    breed TEXT,
    age INTEGER,
    gender TEXT,
    size TEXT,
    temperament TEXT,
    energy_level TEXT,
    grooming_needs TEXT,
    good_with_children BOOLEAN,
    good_with_other_pets BOOLEAN,
    special_needs TEXT,
    description TEXT
);
`;

/**
 * 猫推薦システムクラス
 */
class CatRecommendationSystem {
  private agentExecutor: AgentExecutor;

  /**
   * コンストラクタ
   * @param agentExecutor エージェント実行者
   */
  constructor(agentExecutor: AgentExecutor) {
    this.agentExecutor = agentExecutor;
  }

  /**
   * ユーザーの要望に基づいて猫を推薦する
   * @param userQuery ユーザーからの質問や条件
   * @returns 推薦結果
   */
  async recommendCat(userQuery: string): Promise<any> {
    return await this.agentExecutor.invoke(
        {input: userQuery}
    );
  }
}

/**
 * 猫推薦システムを初期化する
 * @returns 初期化された猫推薦システム
 */
async function initCatRecommendationSystem(): Promise<CatRecommendationSystem> {
  // DBソース設定
  const datasource = new DataSource({
    type: "sqlite",
    database: "cats.db",
    synchronize: false,
  });

  await datasource.initialize();

  // SQLデータベースとツールキットの設定
  const db = await SqlDatabase.fromDataSourceParams({
    appDataSource: datasource,
    includesTables: ["cats"]
  });

  // Anthropic Claudeの設定
  const llm = new ChatAnthropic({
    anthropicApiKey: ANTHROPIC_API_KEY,
    model: "claude-3-7-sonnet-20250219", // 最新のClaudeモデルを指定
    temperature: 0.2,
  });

  const toolkit = new SqlToolkit(db);

  // エージェントの作成（Anthropic用）
  const agent = await createSqlAgent(
    llm,
    toolkit,
  );

  return new CatRecommendationSystem(agent);
}

/**
 * サンプルデータベースをセットアップする関数
 */
async function setupSampleDatabase(): Promise<void> {
  const sqlite3 = require("sqlite3").verbose();
  const db = new sqlite3.Database("cats.db");

  // テーブルの作成
  await new Promise<void>((resolve, reject) => {
    db.run(`
    CREATE TABLE IF NOT EXISTS cats (
      id INTEGER PRIMARY KEY,
      name TEXT,
      breed TEXT,
      age INTEGER,
      gender TEXT,
      size TEXT,
      temperament TEXT,
      energy_level TEXT,
      grooming_needs TEXT,
      good_with_children BOOLEAN,
      good_with_other_pets BOOLEAN,
      special_needs TEXT,
      description TEXT
    )
    `, (err: Error | null) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // サンプルデータ
  const sampleCats = [
    [1, 'ミィ', 'アメリカンショートヘア', 3, 'メス', '中型', '温厚', '中程度', '低', 1, 1, '',
      'アメリカンショートヘアは独立心があり、一人暮らしでも飼いやすい猫種です。お手入れも比較的簡単です。'],
    [2, 'レオ', 'スコティッシュフォールド', 2, 'オス', '中型', '温厚', '低', '中程度', 1, 1, '',
      'スコティッシュフォールドは穏やかな性格で、初心者にも飼いやすいです。'],
    [3, 'ルナ', 'ロシアンブルー', 4, 'メス', '中型', '温厚', '中程度', '低', 1, 0, '',
      'ロシアンブルーは静かで賢く、グルーミングの必要性が低いため、お手入れが簡単です。'],
    [4, 'マックス', 'メインクーン', 5, 'オス', '大型', '社交的', '高', '高', 1, 1, '',
      'メインクーンは犬のような性格で社交的ですが、大きな体のためのお手入れは必要です。'],
    [5, 'ベル', 'ラグドール', 3, 'メス', '大型', '穏やか', '低', '高', 1, 1, '',
      'ラグドールは抱っこされるのが好きで甘えん坊、しかし長毛種のためお手入れが必要です。'],
    [6, 'キキ', 'シャム', 2, 'メス', '中型', '活発', '高', '低', 0, 0, '',
      'シャムは非常に活発で賢いですが、刺激が必要で留守番が多いと寂しがることがあります。'],
    [7, 'トム', 'ブリティッシュショートヘア', 6, 'オス', '中型', '独立的', '低', '中程度', 1, 1, '',
      'ブリティッシュショートヘアは独立心が強く、留守番も得意です。初心者向きの猫種です。'],
    [8, 'モカ', 'エキゾチックショートヘア', 4, 'メス', '中型', '温厚', '低', '中程度', 1, 1, '',
      'エキゾチックショートヘアはペルシャの短毛版で、温厚な性格ですが、顔の構造上の健康問題に注意が必要です。']
  ];

  // データの挿入
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO cats 
    (id, name, breed, age, gender, size, temperament, energy_level, grooming_needs, 
     good_with_children, good_with_other_pets, special_needs, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const cat of sampleCats) {
    await new Promise<void>((resolve, reject) => {
      stmt.run(cat, (err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  stmt.finalize();
  db.close();

  console.log("サンプルデータベースのセットアップが完了しました。");
}

/**
 * メイン実行関数
 */
async function main() {
  try {
    // データベースのセットアップ
    await setupSampleDatabase();

    // 猫推薦システムの初期化
    const catRecommender = await initCatRecommendationSystem();

    // ユーザーからの入力例
    const userQuery = 'get スコティッシュフォールド'

    console.log("ユーザーの質問:", userQuery);

    // 推薦結果の取得
    const result = await catRecommender.recommendCat(userQuery);
    console.log(result)
    console.log(`Got output ${result.output}`);

    console.log(
        `Got intermediate steps ${JSON.stringify(
            result.intermediateSteps,
            null,
            2
        )}`
    );

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

/**
 * Antropicのモデルリスト
 * 必要に応じて最新のモデルに更新してください
 */
const ANTHROPIC_MODELS = {
  CLAUDE_3_OPUS: "claude-3-opus-20240229",
  CLAUDE_3_SONNET: "claude-3-sonnet-20240229",
  CLAUDE_3_HAIKU: "claude-3-haiku-20240307",
  CLAUDE_2_1: "claude-2.1",
  CLAUDE_2_0: "claude-2.0",
  CLAUDE_INSTANT_1_2: "claude-instant-1.2"
};

// スクリプトが直接実行された場合
if (require.main === module) {
  main();
}

export { CatRecommendationSystem, initCatRecommendationSystem, setupSampleDatabase };