import type { IntentId, RouteDefinition, TargetId } from "../types";

export const concreteTechniqueRoutes: RouteDefinition[] = [
  {
    targetId: "bass",
    intentId: "break",
    target: "ベース",
    intent: "崩す",
    description: "ベースを崩して、ループに隙間や揺らぎを作るルート。",
  },
  {
    targetId: "chords",
    intentId: "build",
    target: "コード",
    intent: "盛り上げる",
    description: "コードを広げたり明るくしたりして、展開感を作るルート。",
  },
  {
    targetId: "keys",
    intentId: "chill",
    target: "キーボード",
    intent: "チル",
    description: "キーボードを丸く揺らして、落ち着いた空気を作るルート。",
  },
  {
    targetId: "strings",
    intentId: "widen",
    target: "ストリングス",
    intent: "広げる",
    description: "ストリングスを上下左右に広げて、背景の厚みと奥行きを作るルート。",
  },
  {
    targetId: "bells",
    intentId: "random",
    target: "ベル",
    intent: "ランダム感",
    description: "ベルを散らして、偶然鳴る小さなきらめきやアクセントを作るルート。",
  },
  {
    targetId: "guitar",
    intentId: "forward",
    target: "ギター",
    intent: "前に出す",
    description: "ギターを明るく押し出して、前面のフレーズ感を作るルート。",
  },
  {
    targetId: "voice",
    intentId: "forward",
    target: "ボイス",
    intent: "前に出す",
    description: "ボイス断片を近く、明るく、フックとして聞こえやすくするルート。",
  },
  {
    targetId: "drums",
    intentId: "dance",
    target: "ドラム",
    intent: "踊らせる",
    description: "ドラムの推進力や細かいノリを増やして、踊りやすくするルート。",
  },
  {
    targetId: "drums",
    intentId: "build",
    target: "ドラム",
    intent: "盛り上げる",
    description: "ドラムの密度、音量、フィルを増やして、展開前の高まりを作るルート。",
  },
  {
    targetId: "drums",
    intentId: "remove",
    target: "ドラム",
    intent: "抜く",
    description: "ドラムの密度や明るさを落として、展開に余白やドロップ感を作るルート。",
  },
  {
    targetId: "bass",
    intentId: "dance",
    target: "ベース",
    intent: "踊らせる",
    description: "ベースの重心、裏拍、短さを調整して、体が動くグルーヴを作るルート。",
  },
  {
    targetId: "chords",
    intentId: "chill",
    target: "コード",
    intent: "チル",
    description: "コードを丸く、遅く、奥に置いて、落ち着いた空気を作るルート。",
  },
  {
    targetId: "keys",
    intentId: "random",
    target: "キーボード",
    intent: "ランダム感",
    description: "キーボードの鳴り方、音高、タイミングを少し揺らして、偶然性のあるフレーズを作るルート。",
  },
  {
    targetId: "drums",
    intentId: "break",
    target: "ドラム",
    intent: "崩す",
    description: "ドラムの規則性を崩して、フィルやブレイク前の引っかかりを作るルート。",
  },
  {
    targetId: "bass",
    intentId: "build",
    target: "ベース",
    intent: "盛り上げる",
    description: "ベースの明るさ、密度、押し出しを増やして、展開の熱量を上げるルート。",
  },
  {
    targetId: "chords",
    intentId: "widen",
    target: "コード",
    intent: "広げる",
    description: "コードの音域、余韻、奥行きを広げて、曲の面を大きくするルート。",
  },
  {
    targetId: "bass",
    intentId: "remove",
    target: "ベース",
    intent: "抜く",
    description: "ベースの量、長さ、明るさを落として、低音の余白とドロップ感を作るルート。",
  },
  {
    targetId: "chords",
    intentId: "remove",
    target: "コード",
    intent: "抜く",
    description: "コードの主張を下げて、曲に余白、奥行き、落ち着きを作るルート。",
  },
  {
    targetId: "drums",
    intentId: "chill",
    target: "ドラム",
    intent: "チル",
    description: "ドラムの明るさや密度を抑えて、落ち着いたグルーヴにするルート。",
  },
];

export function getRouteKey(targetId: TargetId, intentId: IntentId) {
  return `${targetId}:${intentId}`;
}

export function getRouteDefinition(targetId: TargetId, intentId: IntentId) {
  const routeKey = getRouteKey(targetId, intentId);

  return concreteTechniqueRoutes.find(
    (route) => getRouteKey(route.targetId, route.intentId) === routeKey,
  );
}

export function isConcreteTechniqueRoute(targetId: TargetId, intentId: IntentId) {
  return getRouteDefinition(targetId, intentId) !== undefined;
}
