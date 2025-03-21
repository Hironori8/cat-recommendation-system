import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {ANTHROPIC_API_KEY, OPENAI_API_KEY} from "./config";
import {ChatAnthropic} from "@langchain/anthropic";
import * as sqlite3 from "sqlite3";
import { open, Database } from "sqlite";


// データベースのセットアップ関数
async function setupDatabase(): Promise<Database> {
  // SQLiteデータベースを開く（存在しない場合は作成）
  const db = await open({
    filename: "cats.db",
    driver: sqlite3.Database,
  });

  // テーブル作成
  await db.exec(`
    CREATE TABLE IF NOT EXISTS cat_breeds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      origin TEXT,
      temperament TEXT,
      description TEXT,
      price_min INTEGER,
      price_max INTEGER,
      size TEXT,
      fur_length TEXT,
      shedding_level INTEGER,
      friendliness_level INTEGER,
      energy_level INTEGER,
      health_issues_level INTEGER,
      grooming_needs INTEGER,
      good_with_children INTEGER,
      good_with_other_pets INTEGER,
      indoor_outdoor TEXT
    )
  `);

  // サンプルデータの挿入（テーブルが空の場合のみ）
  const count = await db.get("SELECT COUNT(*) as count FROM cat_breeds");
  if (count.count === 0) {
    await db.exec(`
      INSERT INTO cat_breeds (name, origin, temperament, description, price_min, price_max, size, fur_length, shedding_level, friendliness_level, energy_level, health_issues_level, grooming_needs, good_with_children, good_with_other_pets, indoor_outdoor) VALUES
      ('スコティッシュフォールド', 'スコットランド', '優しい、穏やか、甘えん坊', '折れ曲がった耳が特徴的な猫種。穏やかで人懐っこい性格が魅力。', 80000, 200000, '中型', '短毛/長毛', 3, 5, 3, 4, 2, 5, 4, '室内向け'),
      ('アメリカンショートヘア', 'アメリカ', '社交的、独立心が強い、遊び好き', '丈夫な体と丸い顔が特徴。独立心が強く、飼いやすい猫種として人気。', 50000, 150000, '中型', '短毛', 3, 4, 3, 2, 2, 4, 4, '室内外可'),
      ('メインクーン', 'アメリカ', '優しい巨人、社交的、知的', '大型の猫種で、豪華な被毛と愛らしい性格が魅力。犬のような忠誠心を持つと言われる。', 100000, 300000, '大型', '長毛', 4, 5, 4, 3, 4, 5, 4, '室内向け'),
      ('ラグドール', 'アメリカ', '穏やか、人懐っこい、抱っこされるのが好き', '抱っこすると体がぬいぐるみのように脱力することが名前の由来。美しい青い目が特徴。', 100000, 250000, '大型', '長毛', 2, 5, 2, 3, 3, 5, 4, '室内向け'),
      ('ロシアンブルー', 'ロシア', '穏やか、内気、知的', '銀色がかった青い被毛と緑の目が特徴。繊細でエレガントな猫種。', 80000, 200000, '中型', '短毛', 1, 3, 3, 1, 2, 4, 4, '室内向け'),
      ('ベンガル', 'アメリカ', '活発、遊び好き、好奇心旺盛', '野生のヒョウのような外見が特徴。非常に活発で、知的な猫種。', 150000, 400000, '中型', '短毛', 2, 3, 5, 2, 3, 3, 3, '室内向け'),
      ('ノルウェージャンフォレストキャット', 'ノルウェー', '穏やか、社交的、独立心がある', '北欧の森で生き抜いた猫種。厚い被毛と強健な体が特徴。', 100000, 250000, '大型', '長毛', 4, 4, 4, 2, 4, 4, 4, '室内外可'),
      ('シャム', 'タイ', '社交的、声が大きい、活発', 'ポイントカラーの被毛と青い目が特徴。非常におしゃべりで、飼い主に愛着を示す。', 60000, 180000, '小〜中型', '短毛', 2, 4, 5, 2, 2, 4, 3, '室内向け'),
      ('ブリティッシュショートヘア', 'イギリス', '穏やか、独立心がある、落ち着いている', 'ぬいぐるみのような丸顔と丸い目が特徴。適度な距離感を保ちつつも愛情深い。', 80000, 200000, '中〜大型', '短毛', 3, 3, 2, 2, 2, 4, 4, '室内向け'),
      ('エキゾチックショートヘア', 'アメリカ', '穏やか、甘えん坊、遊び好き', 'ペルシャの短毛版とも呼ばれる。丸い顔と平らな鼻が特徴。', 100000, 250000, '中型', '短毛', 2, 4, 3, 3, 3, 4, 3, '室内向け'),
      ('アビシニアン', 'エチオピア', '活発、好奇心旺盛、知的', '「猫の中の猫」とも呼ばれる古い猫種。細身の体と大きな耳が特徴。', 80000, 200000, '中型', '短毛', 2, 3, 5, 2, 2, 3, 3, '室内向け'),
      ('ペルシャ', 'イラン', '穏やか、静か、優雅', '豪華な長毛と平らな顔が特徴。おっとりとした性格で、のんびり過ごすのが好き。', 100000, 300000, '中型', '長毛', 4, 3, 1, 4, 5, 4, 3, '室内向け'),
      ('マンチカン', '世界各地', '遊び好き、社交的、好奇心旺盛', '短い足が特徴的な猫種。明るく社交的な性格で人気。', 100000, 300000, '小〜中型', '短毛/長毛', 3, 4, 4, 3, 3, 4, 4, '室内向け'),
      ('サイベリアン', 'ロシア', '社交的、遊び好き、声が静か', 'シベリアの森林地帯出身の猫種。アレルギーを引き起こす可能性が低いとされる。', 100000, 250000, '大型', '長毛', 3, 4, 4, 2, 3, 5, 3, '室内外可'),
      ('バーミーズ', 'ミャンマー', '社交的、甘えん坊、声が大きい', '艶やかな黒みがかった被毛と黄金色の目が特徴。非常に人懐っこい性格。', 80000, 200000, '中型', '短毛', 2, 5, 4, 2, 2, 5, 4, '室内向け')
    `);
    console.log("サンプルデータをデータベースに挿入しました");
  }

  return db;
}

// 好みの型定義
interface CatPreferences {
  budget?: number;
  size?: string;
  furLength?: string;
  activityLevel?: string;
  goodWithChildren?: boolean;
  goodWithPets?: boolean;
  prioritizeHealth?: boolean;
}

// 猫の種類を検索する関数
async function searchCatBreeds(db: Database, preferences: CatPreferences): Promise<any[]> {
  // 検索条件の構築
  let query = "SELECT * FROM cat_breeds WHERE 1=1";
  const params: any[] = [];

  // 予算範囲の条件
  if (preferences.budget) {
    query += " AND price_min <= ?";
    params.push(preferences.budget);
  }

  // サイズの条件
  if (preferences.size) {
    query += " AND size LIKE ?";
    params.push(`%${preferences.size}%`);
  }

  // 毛の長さの条件
  if (preferences.furLength) {
    query += " AND fur_length LIKE ?";
    params.push(`%${preferences.furLength}%`);
  }

  // 活発さの条件
  if (preferences.activityLevel) {
    if (preferences.activityLevel === "高い") {
      query += " AND energy_level >= 4";
    } else if (preferences.activityLevel === "普通") {
      query += " AND energy_level = 3";
    } else if (preferences.activityLevel === "低い") {
      query += " AND energy_level <= 2";
    }
  }

  // 子供との相性の条件
  if (preferences.goodWithChildren) {
    query += " AND good_with_children >= 4";
  }

  // 他のペットとの相性の条件
  if (preferences.goodWithPets) {
    query += " AND good_with_other_pets >= 4";
  }

  // 健康問題の少なさを優先
  if (preferences.prioritizeHealth) {
    query += " ORDER BY health_issues_level ASC";
  } else {
    // デフォルトはフレンドリーさでソート
    query += " ORDER BY friendliness_level DESC";
  }

  // 結果を制限
  query += " LIMIT 5";

  // クエリを実行
  const results = await db.all(query, ...params);
  return results;
}

// ユーザーの好みを分析する関数
async function analyzeCatPreferences(model: ChatAnthropic, userRequest: string): Promise<CatPreferences> {
  const promptTemplate = PromptTemplate.fromTemplate(`
    あなたは猫の専門家です。以下のユーザーの文章から、猫の好みを抽出してください。
    可能な限り以下の情報を抽出し、JSONフォーマットで返してください。
    
    - budget: 予算（数値、単位は円）
    - size: 希望するサイズ（小型、中型、大型のいずれか）
    - furLength: 希望する毛の長さ（短毛、長毛のいずれか）
    - activityLevel: 希望する活発さ（低い、普通、高いのいずれか）
    - goodWithChildren: 子供と仲良くできる必要があるか（true/false）
    - goodWithPets: 他のペットと仲良くできる必要があるか（true/false）
    - prioritizeHealth: 健康問題の少なさを優先するか（true/false）
    
    見つからない情報は含めないでください。
    
    ユーザーの文章: {userRequest}
    
    JSON形式の回答:
  `);

  const chain = promptTemplate.pipe(model).pipe(new StringOutputParser());

  const result = await chain.invoke({ userRequest });

  try {
    // 結果をJSONとしてパース
    const preferences = JSON.parse(result);
    return preferences;
  } catch (error) {
    console.error("JSONのパースに失敗しました:", error);
    console.log("受け取った文字列:", result);
    return {}; // 空のオブジェクトを返す
  }
}

// 猫の種類を推薦する関数
async function recommendCatBreed(model: ChatAnthropic, breeds: any[]): Promise<string> {
  // データがない場合
  if (breeds.length === 0) {
    return "あなたの条件に合う猫種が見つかりませんでした。条件を変えてもう一度お試しください。";
  }

  // 推薦用のプロンプト
  const promptTemplate = PromptTemplate.fromTemplate(`
    あなたは猫の専門家です。ユーザーの好みに基づいて、以下の猫種から最適な推薦を行い、その理由を説明してください。
    
    利用可能な猫種:
    {breedData}
    
    以下の形式で回答してください:
    1. 最もおすすめの猫種とその理由
    2. 他の候補の猫種についての簡単な説明
    3. 飼育時の注意点やアドバイス
    
    回答:
  `);

  // 猫種データを文字列に変換
  const breedData = breeds.map((breed, index) => {
    return `猫種${index + 1}: ${breed.name}
      原産地: ${breed.origin}
      気質: ${breed.temperament}
      説明: ${breed.description}
      価格帯: ${breed.price_min}円～${breed.price_max}円
      サイズ: ${breed.size}
      毛の長さ: ${breed.fur_length}
      抜け毛レベル: ${breed.shedding_level}/5
      フレンドリーさ: ${breed.friendliness_level}/5
      活発さ: ${breed.energy_level}/5
      健康問題: ${breed.health_issues_level}/5（低いほど健康）
      グルーミング必要度: ${breed.grooming_needs}/5
      子供との相性: ${breed.good_with_children}/5
      他のペットとの相性: ${breed.good_with_other_pets}/5
      適した環境: ${breed.indoor_outdoor}
    `;
  }).join("\n\n");

  const chain = promptTemplate.pipe(model).pipe(new StringOutputParser());

  const recommendation = await chain.invoke({ breedData });
  return recommendation;
}

// メイン関数
async function main() {
  try {
    console.log("猫の種類推薦システムを初期化中...");

    // データベースのセットアップ
    const db = await setupDatabase();
    console.log("データベースの準備ができました");

    // Claudeモデルを初期化
    const model = new ChatAnthropic({
      anthropicApiKey: ANTHROPIC_API_KEY,
      model: "claude-3-7-sonnet-20250219", // 最新のClaudeモデルを指定
      temperature: 0.3,
    });

    // ユーザーの入力を処理
    const readline = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log("\n=== 猫の種類推薦システム ===");
    console.log("予算、希望するサイズ、毛の長さ、活発さ、子供や他のペットとの相性など、");
    console.log("あなたの好みや状況を教えてください。");
    console.log("例: 「10万円以下で、子供と仲良くできる、毛が短めの大人しい猫を探しています」");
    console.log("終了するには「exit」と入力してください。");

    const askPreference = async () => {
      readline.question("\nあなたの好みを教えてください > ", async (input: string) => {
        if (input.toLowerCase() === "exit") {
          console.log("システムを終了します");
          await db.close();
          readline.close();
          return;
        }

        try {
          console.log("あなたの好みを分析中...");
          // ユーザーの好みを分析
          const preferences = await analyzeCatPreferences(model, input);
          console.log("分析結果:", preferences);

          console.log("条件に合う猫種を検索中...");
          // データベースから猫種を検索
          const matchingBreeds = await searchCatBreeds(db, preferences);

          console.log(`${matchingBreeds.length}匹の候補が見つかりました`);

          console.log("最適な猫種を推薦中...");
          // 猫種を推薦
          const recommendation = await recommendCatBreed(model, matchingBreeds);

          console.log("\n=== あなたへのおすすめ ===");
          console.log(recommendation);
        } catch (error) {
          console.error("エラーが発生しました:", error);
        }

        // 次の質問へ
        askPreference();
      });
    };

    // 質問を開始
    askPreference();

  } catch (error) {
    console.error("システムエラーが発生しました:", error);
  }
}

main()
