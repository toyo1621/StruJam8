import { describe, expect, it } from "vitest";
import { getTechniqueOptions, intents, targets } from "./pads";
import { concreteTechniqueRoutes, getRouteDefinition, getRouteKey } from "./routes";
import { getTechniqueById, getTechniquesByRoute, techniques } from "./techniques";

describe("technique catalog", () => {
  it("defines unique technique ids", () => {
    const ids = techniques.map((technique) => technique.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });

  it("defines unique concrete route keys", () => {
    const routeKeys = concreteTechniqueRoutes.map((route) =>
      getRouteKey(route.targetId, route.intentId),
    );

    expect(new Set(routeKeys).size).toBe(routeKeys.length);
  });

  it("finds concrete route definitions by target and intent", () => {
    expect(getRouteDefinition("drums", "build")?.description).toContain("密度");
    expect(getRouteDefinition("drums", "chill")).toBeUndefined();
  });

  it("covers every target with at least one concrete route", () => {
    const coveredTargetIds = new Set(concreteTechniqueRoutes.map((route) => route.targetId));
    const targetIds = new Set(targets.map((target) => target.id));

    expect(coveredTargetIds).toEqual(targetIds);
  });

  it("covers every intent with at least one concrete route", () => {
    const coveredIntentIds = new Set(concreteTechniqueRoutes.map((route) => route.intentId));
    const intentIds = new Set(intents.map((intent) => intent.id));

    expect(coveredIntentIds).toEqual(intentIds);
  });

  it("returns the concrete bass break route", () => {
    const routeTechniques = getTechniquesByRoute("bass", "break");

    expect(routeTechniques).toHaveLength(8);
    expect(routeTechniques.map((technique) => technique.label)).toEqual([
      "音を抜く",
      "オクターブ跳ね",
      "リズムずらし",
      "たまに休む",
      "音を反転",
      "うねらせる",
      "歪ませる",
      "フィルター閉じる",
    ]);
  });

  it("returns the concrete chords build route", () => {
    const routeTechniques = getTechniquesByRoute("chords", "build");

    expect(routeTechniques).toHaveLength(8);
    expect(routeTechniques[0]?.strudelSnippet).toBe(".sometimes(add(note(\"12\")))");
    expect(routeTechniques[7]?.strudelSnippet).toBe(".gain(0.75)");
  });

  it("returns the concrete drums dance route", () => {
    const routeTechniques = getTechniquesByRoute("drums", "dance");

    expect(routeTechniques).toHaveLength(8);
    expect(routeTechniques.map((technique) => technique.label)).toEqual([
      "キック強め",
      "ハット細かく",
      "裏拍を足す",
      "スネア前に",
      "ゴースト追加",
      "少し跳ねる",
      "ミニフィル",
      "タイトに切る",
    ]);
  });

  it("returns the concrete drums build route", () => {
    const routeTechniques = getTechniquesByRoute("drums", "build");

    expect(routeTechniques).toHaveLength(8);
    expect(routeTechniques.map((technique) => technique.label)).toEqual([
      "キック増やす",
      "クラップ厚く",
      "ハット開く",
      "フィル前に",
      "音量を上げる",
      "軽く歪ませる",
      "余韻を足す",
      "前で反転",
    ]);
    expect(routeTechniques.filter((technique) => technique.needsTodo)).toHaveLength(2);
  });


  it("returns the concrete drums break route", () => {
    const routeTechniques = getTechniquesByRoute("drums", "break");

    expect(routeTechniques).toHaveLength(8);
    expect(routeTechniques.map((technique) => technique.label)).toEqual([
      "拍をずらす",
      "逆に流す",
      "時々倍速",
      "欠けさせる",
      "高音だけにする",
      "細かい影",
      "粗くする",
      "たまに反転",
    ]);
  });

  it("returns the concrete bass build route", () => {
    const routeTechniques = getTechniquesByRoute("bass", "build");

    expect(routeTechniques).toHaveLength(8);
    expect(routeTechniques.map((technique) => technique.label)).toEqual([
      "音量を上げる",
      "フィルター開く",
      "高い返しを足す",
      "歪みを足す",
      "小走りを入れる",
      "長く押す",
      "裏で厚くする",
      "低音を太く",
    ]);
    expect(routeTechniques[2]?.strudelSnippet).toBe(".sometimes(add(note(\"12\")))");
  });

  it("returns the concrete chords widen route", () => {
    const routeTechniques = getTechniquesByRoute("chords", "widen");

    expect(routeTechniques).toHaveLength(8);
    expect(routeTechniques.map((technique) => technique.label)).toEqual([
      "高音を重ねる",
      "低音を重ねる",
      "空間を広げる",
      "雲みたいに伸ばす",
      "長くつなぐ",
      "明るく開く",
      "遅れを重ねる",
      "左右に揺らす",
    ]);
    expect(routeTechniques.filter((technique) => technique.needsTodo)).toHaveLength(1);
  });

  it("returns the concrete drums remove route", () => {
    const routeTechniques = getTechniquesByRoute("drums", "remove");

    expect(routeTechniques).toHaveLength(8);
    expect(routeTechniques.map((technique) => technique.label)).toEqual([
      "音数を抜く",
      "半分に落とす",
      "小さくする",
      "こもらせる",
      "高音だけ残す",
      "逆に流す",
      "休みを作る",
      "影だけ残す",
    ]);
    expect(routeTechniques.filter((technique) => technique.needsTodo)).toHaveLength(1);
  });

  it("returns the concrete bass dance route", () => {
    const routeTechniques = getTechniquesByRoute("bass", "dance");

    expect(routeTechniques).toHaveLength(8);
    expect(routeTechniques.map((technique) => technique.label)).toEqual([
      "重心を押す",
      "裏拍を足す",
      "短く切る",
      "低音を丸める",
      "小走りを足す",
      "オクターブ返し",
      "フィルター弾み",
      "少し荒くする",
    ]);
    expect(routeTechniques[5]?.strudelSnippet).toBe(".sometimes(add(note(\"12\")))");
  });

  it("returns the concrete chords chill route", () => {
    const routeTechniques = getTechniquesByRoute("chords", "chill");

    expect(routeTechniques).toHaveLength(8);
    expect(routeTechniques.map((technique) => technique.label)).toEqual([
      "音を丸くする",
      "ゆっくり鳴らす",
      "空間を深く",
      "音量を下げる",
      "長くつなぐ",
      "余韻を伸ばす",
      "遅れを重ねる",
      "少し抜く",
    ]);
  });

  it("returns the concrete keys random route", () => {
    const routeTechniques = getTechniquesByRoute("keys", "random");

    expect(routeTechniques).toHaveLength(8);
    expect(routeTechniques.map((technique) => technique.label)).toEqual([
      "たまに鳴る",
      "高く跳ねる",
      "逆に流す",
      "ずらし影",
      "時々細かく",
      "明暗ゆらぎ",
      "小さな残響",
      "低く返す",
    ]);
    expect(routeTechniques[7]?.strudelSnippet).toBe(".sometimes(add(note(\"-12\")))");
  });

  it("returns the concrete keys chill route", () => {
    const routeTechniques = getTechniquesByRoute("keys", "chill");

    expect(routeTechniques).toHaveLength(8);
    expect(routeTechniques.map((technique) => technique.label)).toEqual([
      "音を丸くする",
      "ゆっくり鳴らす",
      "空間を足す",
      "音量を下げる",
      "音を伸ばす",
      "ゆらぎを足す",
      "薄いディレイ",
      "少し抜く",
    ]);
  });

  it("returns the concrete strings widen route", () => {
    const routeTechniques = getTechniquesByRoute("strings", "widen");

    expect(routeTechniques).toHaveLength(8);
    expect(routeTechniques.map((technique) => technique.label)).toEqual([
      "高音を重ねる",
      "低音を重ねる",
      "空間を広げる",
      "ゆっくり開く",
      "左右に揺らす",
      "長く伸ばす",
      "薄く重ねる",
      "背景へ下げる",
    ]);
    expect(routeTechniques[4]?.needsTodo).toBe(true);
  });

  it("returns the concrete bells random route", () => {
    const routeTechniques = getTechniquesByRoute("bells", "random");

    expect(routeTechniques).toHaveLength(8);
    expect(routeTechniques.map((technique) => technique.label)).toEqual([
      "たまに鳴る",
      "高く跳ねる",
      "遅れて鳴る",
      "逆に流す",
      "キラキラ反復",
      "小さく揺れる",
      "左右に散る",
      "余韻を足す",
    ]);
    expect(routeTechniques.filter((technique) => technique.needsTodo)).toHaveLength(2);
  });

  it("returns the concrete guitar forward route", () => {
    const routeTechniques = getTechniquesByRoute("guitar", "forward");

    expect(routeTechniques).toHaveLength(8);
    expect(routeTechniques.map((technique) => technique.label)).toEqual([
      "音量を上げる",
      "明るくする",
      "軽く歪ませる",
      "近くに置く",
      "アタック強め",
      "ダブル感",
      "左右に広げる",
      "ミニフィル",
    ]);
  });

  it("returns the concrete voice forward route", () => {
    const routeTechniques = getTechniquesByRoute("voice", "forward");

    expect(routeTechniques).toHaveLength(8);
    expect(routeTechniques.map((technique) => technique.label)).toEqual([
      "音量を上げる",
      "近くに置く",
      "明るくする",
      "短く切る",
      "ダブル感",
      "少し歪ませる",
      "エコー返し",
      "叫びを足す",
    ]);
    expect(routeTechniques.filter((technique) => technique.needsTodo)).toHaveLength(2);
  });

  it("returns no concrete techniques for undefined routes", () => {
    expect(getTechniquesByRoute("drums", "chill")).toEqual([]);
  });

  it("keeps every concrete route at eight techniques", () => {
    concreteTechniqueRoutes.forEach((route) => {
      const routeTechniques = getTechniquesByRoute(route.targetId, route.intentId);

      expect(routeTechniques).toHaveLength(8);
      expect(new Set(routeTechniques.map((technique) => technique.target))).toEqual(
        new Set([route.target]),
      );
      expect(new Set(routeTechniques.map((technique) => technique.intent))).toEqual(
        new Set([route.intent]),
      );
    });
  });

  it("does not define techniques outside declared concrete routes", () => {
    const declaredRouteKeys = new Set(
      concreteTechniqueRoutes.map((route) => getRouteKey(route.targetId, route.intentId)),
    );
    const techniqueRouteKeys = new Set(
      techniques.map((technique) => getRouteKey(technique.targetId, technique.intentId)),
    );

    expect(techniqueRouteKeys).toEqual(declaredRouteKeys);
  });

  it("provides learning copy and short labels for concrete techniques", () => {
    expect(
      techniques.every(
        (technique) =>
          technique.description.trim().length > 0 &&
          technique.shortLabel.trim().length > 0 &&
          technique.strudelSnippet.trim().length > 0 &&
          technique.snippetExplanation.trim().length > 0,
      ),
    ).toBe(true);
  });

  it("exposes short labels on concrete technique pads", () => {
    const [firstPad] = getTechniqueOptions("bass", "break");

    expect(firstPad?.label).toBe("音を抜く");
    expect(firstPad?.shortLabel).toBe("抜く");
  });

  it("finds a technique by id", () => {
    expect(getTechniqueById("bass-break-drop-notes")?.strudelSnippet).toBe(".degradeBy(0.2)");
  });
});
