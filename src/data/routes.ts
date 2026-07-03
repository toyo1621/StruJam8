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
