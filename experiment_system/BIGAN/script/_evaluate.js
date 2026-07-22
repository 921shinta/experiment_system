import { dics, evaluateRules } from "./main.js";
import { getSimilarWords } from "./_similarity.js";

const DEBUG_MER = 1;
const DEBUG_MER_2 = 1;
const DEBUG_MER_1 = 1;
const DEBUG_MER_3 = 1;
const DEBUG_MER_4 = 1;
const DEBUG_MER_5 = 1;
const DEBUG_MER_6 = 1;
const DEBUG_SFS = 1;
const DEBUG_MDB = 1;
const DEBUG_GCV = 0;
const RULE_WEIGHT_DECAY = 0.631;

// ==========================================
// 辞書を「輪郭(Figure)」と「柄(Pattern)」に完全分離
// ==========================================
const figureTypeDict = {
    '丸': 'circle', '円': 'circle', '丸い': 'circle', '円形': 'circle',
    '三角': 'triangle', '三角形': 'triangle',
    '四角': 'square', '四角形': 'square', '正方形': 'square', '矩形': 'square',
    '楕円': 'ellipse', '楕円形': 'ellipse'
};

const patternTypeDict = {
    'ドット': 'dot', '水玉': 'dot', 'ドット柄': 'dot',
    'ストライプ': 'stripe', '縞': 'stripe', '縦縞': 'stripe', 'ストライプ柄': 'stripe', '横縞': 'stripe',
    'チェック': 'checker', '格子': 'checker', '市松': 'checker', 'チェック柄': 'checker',
    'ギンガム': 'gingham', 'ギンガムチェック': 'gingham',
    'タータン': 'tartan', 'タータンチェック': 'tartan',
    'バッファロー': 'buffalo', 'バッファローチェック': 'buffalo',
    'ハウンドトゥース': 'houndstooth', '千鳥': 'houndstooth', '千鳥格子': 'houndstooth',
    'ウィンドウペーン': 'windowpane', '窓格子': 'windowpane',
    'アーガイル': 'argyle', 'ひし形': 'argyle',
    'マドラス': 'madras', 'マドラスチェック': 'madras',
    'ふわふわ': 'cloud', 'もこもこ': 'cloud', '雲': 'cloud', 'ふわ': 'cloud',
    'ネオン': 'neon', 'ネオンっぽい': 'neon', '発光': 'neon', '光る': 'neon', 'グロー': 'neon',
    '無地': 'none', '柄なし': 'none', 'シンプル': 'none'
};

const adjustSeverityTable = [
    ["まったく", 0.5],
    ["少し", 0.8],
    ["若干", 0.8],
    ["ちょっと", 0.8],
    ["あまり", 0.8],
    ["やや", 1.5],
    ["かなり", 2],
    ["とても", 2.5],
    ["すごく", 2.5],
    ["もっと", 2.0],
    ["もう少し", 1.5],
    ["すぎる", 2.5]
];

const densityDict = {
    '細かい': { GFZ: -0.2, GRC: 0.2, GFX: -0.15 },
    '細かく': { GFZ: -0.2, GRC: 0.2, GFX: -0.15 },
    '小さい': { GFZ: -0.2, GRC: 0.2, GFX: -0.15 },
    '小さく': { GFZ: -0.2, GRC: 0.2, GFX: -0.15 },
    '密度':   { GFZ: -0.2, GRC: 0.2, GFX: -0.15 },
    '密':     { GFZ: -0.2, GRC: 0.2, GFX: -0.15 },
    '引き':   { GFZ: -0.2, GRC: 0.2, GFX: -0.20 },
    '引いて': { GFZ: -0.2, GRC: 0.2, GFX: -0.20 },
    '遠ざかる': { GFZ: -0.2, GRC: 0.2, GFX: -0.20 },
    '遠く':   { GFZ: -0.2, GRC: 0.2, GFX: -0.20 },
    '縮小':   { GFZ: -0.2, GRC: 0.2, GFX: -0.20 },
    '粗い':   { GFZ: 0.2, GRC: -0.2, GFX: 0.20 },
    '粗く':   { GFZ: 0.2, GRC: -0.2, GFX: 0.20 },
    '荒い':   { GFZ: 0.2, GRC: -0.2, GFX: 0.20 },
    '荒く':   { GFZ: 0.2, GRC: -0.2, GFX: 0.20 },
    '大きい': { GFZ: 0.2, GRC: -0.2, GFX: 0.20 },
    '大きく': { GFZ: 0.2, GRC: -0.2, GFX: 0.20 },
    '近づく': { GFZ: 0.2, GRC: -0.2, GFX: 0.20 },
    '近く':   { GFZ: 0.2, GRC: -0.2, GFX: 0.20 },
    '近づい': { GFZ: 0.2, GRC: -0.2, GFX: 0.20 },
    '拡大':   { GFZ: 0.2, GRC: -0.2, GFX: 0.20 },
    'ズーム':  { GFZ: 0.2, GRC: -0.2, GFX: 0.20 },
};

const thicknessDict = {
    '細い':   { GFY: -0.4, GSW: -0.4 },
    '細く':   { GFY: -0.4, GSW: -0.4 },
    '細め':   { GFY: -0.2, GSW: -0.2 },
    '太い':   { GFY: 0.4, GSW: 0.4 },
    '太く':   { GFY: 0.4, GSW: 0.4 },
    '太め':   { GFY: 0.2, GSW: 0.2 },
};

const emoDict = {
    'エモく': { GFS: -0.3, GBS: -0.3, GFL: -0.1, GBL: -0.1, GFA: -0.2 },
    'エモい': { GFS: -0.3, GBS: -0.3, GFL: -0.1, GBL: -0.1, GFA: -0.2 },
    'エモ':   { GFS: -0.3, GBS: -0.3, GFL: -0.1, GBL: -0.1, GFA: -0.2 },
    'ノスタルジック': { GFS: -0.4, GBS: -0.4, GFL: -0.15, GBL: -0.15, GFA: -0.2 },
    'レトロ': { GFS: -0.3, GBS: -0.3, GFL: -0.05, GBL: -0.05 }
};

const repColors = {
    '赤': [0, 100, 50],
    '青': [240, 100, 50],
    '緑': [120, 100, 50],
    '黄': [60, 100, 50],
    '紫': [300, 100, 50],
    'ピンク': [330, 100, 80],
    '白': [0, 0, 100],
    '黒': [0, 0, 0],
    'グレー': [0, 0, 50],
    '茶色': [30, 100, 30],
    'オレンジ': [30, 100, 50],
    '水色': [180, 100, 50]
};

// 色相を辞書座標系（赤=0度を中心に開く特製座標）に変換するヘルパー
function hueToDictScale(hueDeg) {
    return (hueDeg + 180) / 180 % 2 - 1;
}

const repColorConditions = {};
for (const [name, hsl] of Object.entries(repColors)) {
    let h = hueToDictScale(hsl[0]);
    let s = hsl[1] / 50 - 1;
    let l = hsl[2] / 50 - 1;
    repColorConditions[name] = {
        GBH: h, GFH: h, GRH: h, GSH: h,
        GBS: s, GFS: s, GRS: s, GSS: s,
        GBL: l, GFL: l, GRL: l, GSL: l
    };
}

// ==========================================
// 初期集団生成用の軽量解析関数
// population がまだ存在しない最初の入力（「最初のイメージ」入力）から
// 色・図形・柄だけを抽出する。印象語の評価（GBL等のtarget）は計算しない。
// ==========================================
export async function analyzeInitialText(tokenizer, originalText) {
    let result = {
        colors: [],     // { h, s, l, name } の配列（最大3つまで使用）
        figures: [],    // 'circle' | 'triangle' | ... の配列
        patterns: [],   // 'dot' | 'stripe' | ... の配列（1つのみ採用）
        conditions: {}  // 印象語から得られた遺伝子の目標値（例：{GBL: 0.3, GFL: 0.3, ...}）
    };

    if (!originalText || !originalText.trim()) {
        return result;
    }

    let modifiedText = originalText;
    dics.textReplacementPairs.forEach(pair => {
        modifiedText = modifiedText.replaceAll(pair[0], pair[1]);
    });

    const textArray = modifiedText.split(/[．。()（）\n]\s*/);

    for (let i = 0; i < textArray.length; i++) {
        const singleText = textArray[i];
        if (!singleText) continue;

        const tokens = tokenizer.tokenize(singleText);

        // 形態素複合化（makeEvaluateRule と同じロジックを簡略適用）
        for (let j = 0; j < tokens.length - 1; j++) {
            const token = tokens[j];
            const nextToken = tokens[j + 1];
            if (!nextToken) break;

            if ((token.pos == '名詞') && (nextToken.pos == '名詞')) {
                const currentWord = token.basic_form === '*' ? token.surface_form : token.basic_form;
                const currentMatch = await matchDatabase(currentWord, false);
                if (!currentMatch.found) {
                    tokens.splice(j, 2, compoundTokens(token, nextToken, '名詞', '複合'));
                    j--; continue;
                }
            }
            if ((nextToken.pos == '助詞') || (nextToken.pos == '助動詞')) {
                tokens.splice(j, 2, compoundTokens(token, nextToken));
                j--; continue;
            }
        }

        // makeEvaluateRule と同じスキップリストを適用
        const skipPosInit = new Set(['助詞', '助動詞', '記号']);
        const skipBasicFormsInit = new Set([
            '画像', '生成', '作成', 'する', 'して', 'した', 'なる', 'なっ', 'ある', 'いる',
            'もらう', 'くれる', 'あげる', 'ほしい', 'たい', 'くださる', 'もらえる',
            'どちら', 'どちらも', 'どっち', 'どれ', 'これ', 'それ', 'あれ',
            'っぽい', 'みたい', 'みたいだ', 'ようだ', 'ような', 'そう',
            '使う', '使って', '使った', 'つかう', 'つかって', '的', 'くして', 'く'
        ]);

        for (let j = 0; j < tokens.length; j++) {
            // 意味のない品詞・単語はスキップ
            if (skipPosInit.has(tokens[j].pos)) continue;
            if (skipBasicFormsInit.has(tokens[j].basic_form)) continue;
            if (skipBasicFormsInit.has(tokens[j].surface_form)) continue;

            const searchWord = (tokens[j].basic_form === '*') ? tokens[j].surface_form : tokens[j].basic_form;
            const match = await matchDatabase(searchWord, true); // 初回も類似度計算を使う

            if (match.colorLocked && match.detectedHue !== null) {
                const h = match.detectedHue;
                const exists = result.colors.some(c => Math.abs(c.h - h) < 15);
                if (!exists && result.colors.length < 3) {
                    result.colors.push({ h, s: match.detectedSaturation, l: match.detectedLightness, name: tokens[j].surface_form });
                }
            }
            if (match.detectedFigureType && !result.figures.includes(match.detectedFigureType)) {
                result.figures.push(match.detectedFigureType);
            }
            if (match.detectedPatternType && !result.patterns.includes(match.detectedPatternType)) {
                result.patterns.push(match.detectedPatternType);
            }
            // 印象語の condition をマージ（類似度ヒット含む）
            if (match.condition && Object.keys(match.condition).length > 0) {
                Object.entries(match.condition).forEach(([key, value]) => {
                    if (result.conditions[key] === undefined) {
                        result.conditions[key] = value;
                    } else {
                        result.conditions[key] = (result.conditions[key] + value) / 2;
                    }
                });
            }
            // 類似語の中に代表色（repColors）がヒットしていれば色として記録する
            if (!match.colorLocked && match.condition && Object.keys(match.condition).length > 0) {
                const condHue = match.condition['GBH'];
                if (condHue !== undefined) {
                    // GBH の値から元の Hue を逆算して detectedHue として扱う
                    // hueToDictScale の逆変換: hue = (v % 2 + 1) * 180 - 180
                    const rawHue = ((condHue % 2 + 1) * 180 - 180 + 360) % 360;
                    const exists = result.colors.some(c => Math.abs(c.h - rawHue) < 15);
                    if (!exists && result.colors.length < 3) {
                        const sat = (match.condition['GBS'] + 1) * 50 || 80;
                        const lit = (match.condition['GBL'] + 1) * 50 || 50;
                        result.colors.push({ h: rawHue, s: sat, l: lit, name: tokens[j].surface_form + '(類似度)' });
                        console.log(`[InitialAnalysis] 類似度から色を検出: H:${rawHue} S:${sat} L:${lit}`);
                    }
                }
            }
        }
    }

    console.log('[InitialAnalysis] 検出結果:', result);
    return result;
}

// #MARK: EDF: evaluate
export async function makeEvaluateRule(tokenizer, originalText, population, currentZoom = 1.0) {
    if(DEBUG_MER) console.log('評価して、populationオブジェクトのchromsに適応度を振るよ');

    evaluateRules.forEach(rule => {
        if (!rule.colorLocked) {
            rule.weight *= RULE_WEIGHT_DECAY;
        }
    });

    if(DEBUG_MER_2) console.log(`変換前: ${originalText}`);

    let modifiedText = originalText;
    dics.textReplacementPairs.forEach(pair => {
        modifiedText = modifiedText.replaceAll(pair[0], pair[1]);
    });

    let textArray = modifiedText.split(/[．。()（）\n]\s*/);
    if(DEBUG_MER_2) console.log(`変換・分割後：\n%c${textArray}`, "color: #0ff");
    let tokenizeResultHtml = '';

    let detectedColors = [];   // 肯定・否定を溜め込む生のカラーバインダー
    let detectedFigures = [];  // 図形の肯定・否定を溜め込むバインダー
    let detectedPatterns = []; // 柄の肯定・否定を溜め込むバインダー
    let isRelativeDelta = false;
    let deltaValue = 0;
    let deltaThickness = 0; // 太さ変化量（GSW用）
    let detectedNeon = null;

    for(let i = 0; i < textArray.length; i++) { const singleText = textArray[i];
        if(DEBUG_MER_2) console.log(`text${i}:\n%c${singleText}`, `color: #ff0; font-size: 1.5em; font-weight: 700`);
        if(singleText) {
            const tokens = tokenizer.tokenize(singleText);

            // #MARK: | 形態素複合化
            for(let j = 0; j < tokens.length - 1; j++) {
                const token = tokens[j];
                const nextToken = tokens[j + 1];
                if (!nextToken) break;

                if((token.pos == '名詞') && (nextToken.pos == '名詞')) {
                    const currentWord = token.basic_form === '*' ? token.surface_form : token.basic_form;
                    const currentMatch = await matchDatabase(currentWord, false);
                    if (!currentMatch.found){
                        tokens.splice(j,2,compoundTokens(token, nextToken, '名詞', '複合'));
                        j--; continue;
                    }
                }
                if((token.pos == '動詞') && (nextToken.pos == '動詞')) {
                    tokens.splice(j, 2, compoundTokens(token, nextToken, '動詞', '複合'));
                    j--; continue;
                }
                if((token.pos == '動詞') && (nextToken.pos == '名詞') && (nextToken.pos_detail_1 == '非自立')) {
                    tokens.splice(j, 2, compoundTokens(token, nextToken, '名詞', '複合'));
                    j--; continue;
                }
                if((token.pos == '形容詞') && (nextToken.pos == '名詞') && (nextToken.pos_detail_1 == '接尾')) {
                    tokens.splice(j, 2, compoundTokens(token, nextToken, '名詞', '複合'));
                    j--; continue;
                }
                if(token.pos == '接頭詞') {
                    if(token.pos_detail_1 == '名詞接続') {
                        tokens.splice(j, 2, compoundTokens(token, nextToken, '名詞', '接頭詞付き'));
                    } else if(token.pos_detail_1 == '動詞接続') {
                        tokens.splice(j, 2, compoundTokens(token, nextToken, '動詞', '接頭詞付き'));
                    } else if(token.pos_detail_1 == '形容詞接続') {
                        tokens.splice(j, 2, compoundTokens(token, nextToken, '形容詞', '接頭詞付き'));
                    }
                    j--; continue;
                }
                if(
                    ((nextToken.pos == '形容詞') && (nextToken.pos_detail_1 == '接尾')) ||
                    ((token.pos == '形容詞') && (nextToken.pos == '動詞') && (nextToken.pos_detail_1 == '非自立'))
                ) {
                    tokens.splice(j, 2, compoundTokens(token, nextToken, '形容詞', '複合'));
                    j--; continue;
                }
                if(
                    ((token.pos == '形容詞') || (token.pos == '名詞')) &&
                    (nextToken.pos == '動詞') &&
                    (nextToken.reading && nextToken.reading.startsWith('スギ'))
                ) {
                    tokens.splice(j, 2, compoundTokens(token, nextToken, token.pos, '複合'));
                    j--; continue;
                }
                if((nextToken.pos == '助詞') || (nextToken.pos == '助動詞')) {
                    tokens.splice(j, 2, compoundTokens(token, nextToken));
                    j--; continue;
                }
            }

            for(let j = 1; j < tokens.length; j++){
                const current = tokens[j];
                if(
                    current.negative || 
                    current.surface_form.match(/ない|なく|ません|ぬ|ん|しないで/)
                ){
                    tokens[j - 1].negative = true;
                    console.log(`[negative] "${tokens[j - 1].surface_form}" を否定表現としてマーク（後続: ${current.surface_form}）`);
                }
            }

            console.log("=== 複合後否定トークン ===");
            tokens.forEach(current => {
                console.log(
                    current.surface_form,
                    current.basic_form,
                    current.negative
                );
            });
            
            if (DEBUG_MER_3) {
                let consoleText = '文節: \n%c';
                tokens.forEach(phrase => {
                    consoleText += `${phrase.surface_form} / `
                });
                console.log(consoleText, 'color: #a19d7b');
            }

            // #MARK: | 基本形で照合
            const skipPos = new Set(['助詞', '助動詞', '記号']);
            const skipBasicForms = new Set([
                '画像', '画像を', '生成', '作成', '作っ', '作って', '描い', '描いて', 'デザイン', '絵', '表示', 
                'くして','くし','く','いい','感じ','もの','こと','やつ','する', 'して', 'した', 'る', 'なる', 
                'なっ', 'ある', 'いる', 'もらう', 'くれる', 'あげる', 'ほしい', 'たい', 'くださる', 'もらえる', 
                'どちら', 'どちらも', 'どっち', 'どれ', 'これ', 'それ', 'あれ', 'ここ', 'そこ', 'あそこ', 
                'っぽい', 'みたい', 'みたいだ', 'ようだ', 'ような', 'そう', '使う', '使って', '使った', 
                'つかう', 'つかって','前','後ろ','的'
                ]);
            let severity = 0.2;
            for(let j = 0; j < tokens.length; j++) {
                const pos = tokens[j].pos;
                const emptyMatch = { found: false, topic: [], condition: {}, adjustSeverity: 1, colorLocked: false, detectedHue: null, detectedSaturation: null, detectedLightness: null, detectedFigureType: null, detectedPatternType: null, isDelta: false, isNeon: false };

                if (skipPos.has(pos)) {
                    tokens[j].matchDatabase = emptyMatch;
                } else if (skipBasicForms.has(tokens[j].basic_form)) {
                    tokens[j].matchDatabase = emptyMatch;
                } else {
                    
                    let searchWord = (tokens[j].basic_form === '*') ? tokens[j].surface_form : tokens[j].basic_form;
                    
                    if(DEBUG_MDB) console.log(`[searchWord] "${tokens[j].surface_form}" → base searchWord: "${searchWord}"`);
                    
                    let allowParentSimilarity = tokens[j].children ? false : true; 
                    let combinedMatch = await matchDatabase(searchWord, allowParentSimilarity);

                    if (tokens[j].children) {
                        if(DEBUG_MDB) console.log(`[parentSearch] 子供がいるので親("${searchWord}")の辞書一致のみ確認: found=${combinedMatch.found}`);

                        for (let k = 0; k < tokens[j].children.length; k++) {
                            const childToken = tokens[j].children[k];
                            
                            if (skipPos.has(childToken.pos) || skipBasicForms.has(childToken.basic_form)) {
                                if(DEBUG_MDB) console.log(`[childSearch] スキップ（pos/form）: "${childToken.surface_form}"`);
                                continue; 
                            }
                            
                            let childWord = (childToken.basic_form === '*') ? childToken.surface_form : childToken.basic_form;
                            let childMatch = await matchDatabase(childWord); 
                            
                            if (childMatch.found) {
                                combinedMatch.found = true;
                                childMatch.topic.forEach(t => { 
                                    if(!combinedMatch.topic.includes(t)) combinedMatch.topic.push(t); 
                                });
                                Object.assign(combinedMatch.condition, childMatch.condition);
                                
                                if (childMatch.colorLocked) combinedMatch.colorLocked = true;
                                if (childMatch.detectedHue !== null) combinedMatch.detectedHue = childMatch.detectedHue;
                                if (childMatch.detectedSaturation !== null) combinedMatch.detectedSaturation = childMatch.detectedSaturation;
                                if (childMatch.detectedLightness !== null) combinedMatch.detectedLightness = childMatch.detectedLightness;
                                if (childMatch.detectedFigureType) combinedMatch.detectedFigureType = childMatch.detectedFigureType;
                                if (childMatch.detectedPatternType) combinedMatch.detectedPatternType = childMatch.detectedPatternType;
                                if (childMatch.isDelta) combinedMatch.isDelta = true;
                                if (childMatch.isNeon) combinedMatch.isNeon = true;
                                combinedMatch.adjustSeverity *= childMatch.adjustSeverity;
                            }
                        }
                    }
                    
                    tokens[j].matchDatabase = combinedMatch;
                    if(DEBUG_MDB && tokens[j].children) console.log(`[mergedMatch] "${tokens[j].surface_form}" のマージされた最終解析結果:`, combinedMatch);
                    console.log(
                        tokens[j].surface_form,
                        tokens[j].negative
                    );

                    if (tokens[j].matchDatabase.colorLocked) {
                        let h = tokens[j].matchDatabase.detectedHue;
                        let s = tokens[j].matchDatabase.detectedSaturation;
                        let l = tokens[j].matchDatabase.detectedLightness;

                        let isNegated = tokens[j].negative;
                        if (!isNegated) {
                            for(let k = 1; k <= 2; k++) {
                                if (tokens[j+k]) {
                                    if (tokens[j+k].negative || tokens[j+k].surface_form.match(/ない|なく|ません|ぬ|ん/)) {
                                        isNegated = true;
                                        break;
                                    }
                                    if (tokens[j+k].pos === '名詞') break; 
                                }
                            }
                        }

                        let isRedWrap = (h > 345 || h < 15);
                        let exists = detectedColors.some(c => {
                            return (Math.abs(c.h - h) < 15 || (isRedWrap && (c.h > 345 || c.h < 15))) && c.negative === isNegated;
                        });

                        if (!exists) {
                            detectedColors.push({ h, s, l, name: tokens[j].surface_form, negative: isNegated });
                            console.log(`[Color Binder] ストック: "${tokens[j].surface_form}" (H:${h}, 否定:${isNegated})`);
                        }
                    }

                    if (tokens[j].matchDatabase.detectedFigureType) {
                        let fig = tokens[j].matchDatabase.detectedFigureType;
                        let isFigNegated = tokens[j].negative;
                        if (!isFigNegated) {
                            for(let k = 1; k <= 2; k++) {
                                if (tokens[j+k]) {
                                    if (tokens[j+k].negative || tokens[j+k].surface_form.match(/ない|なく|ません|ぬ|ん|しないで/)) {
                                        isFigNegated = true;
                                        break;
                                    }
                                    if (tokens[j+k].pos === '名詞') break; 
                                }
                            }
                        }
                        if (!detectedFigures.some(f => f.type === fig && f.negative === isFigNegated)) {
                            detectedFigures.push({ type: fig, negative: isFigNegated });
                            console.log(`[Figure Binder] ストック: "${tokens[j].surface_form}" (${fig}, 否定:${isFigNegated})`);
                        }
                    }

                    if (tokens[j].matchDatabase.detectedPatternType) {
                        let pat = tokens[j].matchDatabase.detectedPatternType;
                        let isPatNegated = tokens[j].negative;
                        if (!isPatNegated) {
                            for(let k = 1; k <= 2; k++) {
                                if (tokens[j+k]) {
                                    if (tokens[j+k].negative || tokens[j+k].surface_form.match(/ない|なく|ません|ぬ|ん|しないで/)) {
                                        isPatNegated = true;
                                        break;
                                    }
                                    if (tokens[j+k].pos === '名詞') break; 
                                }
                            }
                        }
                        if (!detectedPatterns.some(p => p.type === pat && p.negative === isPatNegated)) {
                            detectedPatterns.push({ type: pat, negative: isPatNegated });
                            console.log(`[Pattern Binder] ストック: "${tokens[j].surface_form}" (${pat}, 否定:${isPatNegated})`);
                        }
                    }
                    
                    if (tokens[j].matchDatabase.isDelta) {
                        isRelativeDelta = true;
                        const cond = tokens[j].matchDatabase.condition;
                        if (cond && cond['GFX'] !== undefined) {
                            deltaValue = cond['GFX'];
                        } else if (cond && cond['GFZ'] !== undefined) {
                            deltaValue = cond['GFZ'];
                        }
                        if (cond && cond['GSW'] !== undefined) {
                            deltaThickness = cond['GSW'];
                        }
                        console.log(`[density] deltaValue: ${deltaValue}, deltaThickness: ${deltaThickness}`);
                    }

                    if (tokens[j].matchDatabase.isNeon) {
                        detectedNeon = !tokens[j].negative; 
                    }
                }
                severity *= tokens[j].matchDatabase.adjustSeverity;
            }

            // #MARK: | 共通項目取出
            let topicKeys = [['IL','IR','GBH','GBS','GBL','GGT','GGC','GWL','GWA','GWS','GFT','GCX','GCY','GFR','GFZ','GFY','GFX','GFH','GFS','GFL','GFA','GSH','GSS','GSL','GSA','GSW','GRD','GRC','GRR','GRZ','GRH','GRS','GRL','ICA','ICE','IAL','IAB','IBT','IWM','ISH','ISM']];
            let condition = new Object();
            
            tokens.forEach(phrase => {
                if(phrase.matchDatabase.topic.length > 0) {
                    topicKeys.push(phrase.matchDatabase.topic);
                }
                let conditionKeyOfSingleToken = Object.entries(phrase.matchDatabase.condition);
                let coefficient = 1;
            
                if (phrase.negative || phrase.over) {
                    coefficient = -1;
                }
                conditionKeyOfSingleToken.forEach(pair => {
                    let key = pair[0];
                    let value = pair[1] * coefficient;
                    console.log("[grade]", phrase.surface_form, key, pair[1], "=>",value);
                    
                    if(!condition[key]) {
                        condition[key] = { grade: [], deltaGrade: [], stat: [] };
                    }

                    if (phrase.matchDatabase.isDelta) {
                        condition[key].deltaGrade.push(value);
                    } else {
                        condition[key].grade.push(value);
                    }
                });
                
                if (phrase.over) {
                    if (!condition["FGD"]) {
                        condition["FGD"] = { grade: [], deltaGrade: [], stat: [] };
                    }
                    condition["FGD"].grade.push(-1);
                    severity *= 2;
                }
            });

            let intersectionTopicKeys = [];
            if(topicKeys.length > 0) {
                intersectionTopicKeys = JSON.parse(JSON.stringify(topicKeys[0]));
                if(topicKeys.length > 1) {
                    for(let j = 0; j < intersectionTopicKeys.length; j++) {
                        let searchKey = intersectionTopicKeys[j];
                        let isContainAll = true;
                        for(let k = 1; k < topicKeys.length; k++) {
                            if(topicKeys[k].includes(searchKey) == false) {
                                isContainAll = false;
                                break;
                            }
                        }
                        if(!isContainAll) {
                            intersectionTopicKeys.splice(j, 1);
                            j--;
                        }
                    }
                }
            }

            let referredImage;
            let referredChromId = [population.bestChromId, population.pickupChromId];
            if(intersectionTopicKeys.includes('IL') && !intersectionTopicKeys.includes('IR')) {
                referredImage = [referredChromId[0]];
            } else if(!intersectionTopicKeys.includes('IL') && intersectionTopicKeys.includes('IR')) {
                referredImage = [referredChromId[1]];
            } else {
                referredImage = [referredChromId[0], referredChromId[1]];
            }

            referredImage.forEach(chromId => {
                let chrom = population.chroms[chromId];
                intersectionTopicKeys.forEach(topicKey => {
                    if(!condition[topicKey]) {
                        condition[topicKey] = { grade: [], deltaGrade: [], stat: [] };
                    }
                    let valueOfTopic = getChromValue(chrom, topicKey);
                    if(DEBUG_MER_1) console.log(`%c ${topicKey}: ${valueOfTopic.join(',')}`, 'color: #f80');
                    valueOfTopic.forEach(value => {
                        condition[topicKey].stat.push(value);
                    });
                });
            });

            let newRule = {
                'weight': 1,
                'severity': severity,
                'target' : new Object()
            };

            let conditionEntries = Object.entries(condition);
            conditionEntries.forEach(entry => {
                const keyName = entry[0];
                const values = entry[1];
                
                const grade = values.grade || [];
                const deltaGrade = values.deltaGrade || [];
                const stat = values.stat || [];

                let gradeAverage = 0;
                if(grade.length > 0) {
                    grade.forEach(value => { gradeAverage += value / grade.length; });
                }

                let deltaGradeAverage = 0;
                if(deltaGrade.length > 0) {
                    deltaGrade.forEach(value => { deltaGradeAverage += value / deltaGrade.length; });
                }

                if(keyName == "FGD") {
                    if(DEBUG_MER_5) console.log(`%c評価：${keyName} -> ${grade}`, 'color: #0ff');
                    newRule.weight = gradeAverage;
                } else if(keyName == 'IL' || keyName == 'IR') {
                    // 評価値には影響しないのでなにもしない
                } else {
                    if(DEBUG_MER) console.log(`%c評価：${keyName} -> STAT ${stat}, GRADE ${grade}, DELTA ${deltaGrade}`, 'color: #0ff');
                    let targetValues = [];

                    if (deltaGrade.length > 0 && stat.length > 0) {
                        stat.forEach(value => {
                            let target = value + (deltaGradeAverage * severity);
                            target = Math.max(-1.0, Math.min(1.0, target));
                            targetValues.push(target);
                        });
                    } else if (stat.length > 0 && grade.length == 0) {
                        stat.forEach(value => { targetValues.push(value); });
                    } else if(stat.length > 0 && grade.length > 0) {
                        if ((keyName == "GBH") || (keyName == "GFH") || (keyName == "GRH") || (keyName == "GSH")) {
                            targetValues.push(gradeAverage);
                        } else {
                            stat.forEach(value => {
                                targetValues.push(gradeAverage);
                            });
                        }
                    } else if(grade.length > 0){
                        targetValues = Array.from(new Set(grade));
                    }

                    if (targetValues.length > 0) {
                        newRule.target[keyName] = targetValues;
                    }
                }
            });

            const hasColorToken = tokens.some(t => t.matchDatabase && t.matchDatabase.colorLocked);
            if (hasColorToken) {
                newRule.colorLocked = true;
                evaluateRules.forEach(r => r.colorLocked = false);
            }

            if (DEBUG_MER_6) {
                console.log("新しい評価ルール:");
                console.log(newRule);
            }
            
            if (!newRule.colorLocked) {
                evaluateRules.push(newRule);
            }
        }
    }

    // ==========================================
    // ハイブリッド配色マッピング
    // 1色 → 即時全個体書き換え
    // 2色 → 背景＋図形に1色ずつ割り当て
    // 3色 → 背景＋図形＋柄2色目（fg_repeat_changeA_hue）に1色ずつ割り当て
    // ==========================================
    if (detectedColors.length > 0) {
        const positiveColors = detectedColors.filter(c => !c.negative);
        const negativeColors = detectedColors.filter(c => c.negative);

        if (positiveColors.length === 1) {
            const { h, s, l, name } = positiveColors[0];
            console.log(`[Color: Direct Overwrite] 1色指定のため全個体を "${name}" (H:${h}) に強制書き換え（即時反映）`);
            population.chroms.forEach(chrom => {
                chrom.fg_fill_hue                  = h;
                chrom.fg_fill_saturation           = s;
                chrom.fg_fill_lightness            = l;
                chrom.fg_stroke_color_hue          = 0;

                chrom.bgColor_hue                  = h;
                chrom.bgGradient_color_hue         = h;
                chrom.bgColor_saturation           = s * 0.8; 
                chrom.bgGradient_color_saturation  = s * 0.8;
                
                let bgLightness = l > 50 ? Math.max(0, l - 40) : Math.min(100, l + 40);
                chrom.bgColor_lightness            = bgLightness;
                chrom.bgGradient_color_lightness   = bgLightness;

                // ★★★ 追加：柄の2色目（ドットなどの色）をリセットして図形色に揃える ★★★
                chrom.fg_repeat_changeA_hue        = 0;
                chrom.fg_repeat_changeA_saturation = 0;
                chrom.fg_repeat_changeA_lightness  = 0;
            });
            // 色を固定：交叉時もこの色を維持する
            evaluateRules.push({ weight: 0, severity: 0, target: {}, lockedColor: { h, s, l } });

            if (negativeColors.length > 0) {
                let colorRule = {
                    'weight': 1,
                    'severity': 0.2,
                    'target': new Object(),
                    'colorLocked': true,
                    'negativeColors': negativeColors.map(c => hueToDictScale(c.h))
                };
                evaluateRules.forEach(r => r.colorLocked = false);
                evaluateRules.push(colorRule);
            }
        } 
        // 🌟 2色：背景＋図形に固定割り当て（即時反映）
        else if (positiveColors.length === 2) {
            const [colorBg, colorFg] = positiveColors;
            console.log(`[Color: Dual Overwrite] 2色指定のため 背景/柄2色目="${colorBg.name}" / 図形/柄ベース="${colorFg.name}" に即時反映`);
            population.chroms.forEach(chrom => {
                chrom.bgColor_hue                  = colorBg.h;
                chrom.bgGradient_color_hue         = colorBg.h;
                chrom.bgColor_saturation           = colorBg.s * 0.9;
                chrom.bgGradient_color_saturation  = colorBg.s * 0.9;
                chrom.bgColor_lightness            = colorBg.l;
                chrom.bgGradient_color_lightness   = colorBg.l;

                chrom.fg_fill_hue                  = colorFg.h;
                chrom.fg_fill_saturation           = colorFg.s;
                chrom.fg_fill_lightness            = colorFg.l;
                chrom.fg_stroke_color_hue          = 0;
                
                // 相対値（changeA系）は使わないので0にリセット
                chrom.fg_repeat_changeA_hue        = 0;
                chrom.fg_repeat_changeA_saturation = 0;
                chrom.fg_repeat_changeA_lightness  = 0;

                // ★ 新設のバイパス：柄の2色目(colorB)の絶対値を直接プロパティに持たせる
                chrom._absolute_colorB = `hsl(${colorBg.h}, ${colorBg.s * 0.9}%, ${colorBg.l}%)`;
            });

            if (negativeColors.length > 0) {
                let colorRule = {
                    'weight': 1, 'severity': 0.2, 'target': new Object(), 'colorLocked': true,
                    'negativeColors': negativeColors.map(c => hueToDictScale(c.h))
                };
                evaluateRules.forEach(r => r.colorLocked = false);
                evaluateRules.push(colorRule);
            }
        }
        // 🌟 3色以上：背景＋図形＋柄2色目（fg_repeat_changeA_hue）に固定割り当て（即時反映、最大3色まで）
        else if (positiveColors.length >= 3) {
            const [colorBg, colorFg, colorPattern] = positiveColors;
            console.log(`[Color: Triple Overwrite] 3色指定のため 背景="${colorBg.name}" / 図形="${colorFg.name}" / 柄2色目="${colorPattern.name}" に即時反映`);
            population.chroms.forEach(chrom => {
                chrom.bgColor_hue                  = colorBg.h;
                chrom.bgGradient_color_hue         = colorBg.h;
                chrom.bgColor_saturation           = colorBg.s * 0.9;
                chrom.bgGradient_color_saturation  = colorBg.s * 0.9;
                chrom.bgColor_lightness            = colorBg.l;
                chrom.bgGradient_color_lightness   = colorBg.l;

                chrom.fg_fill_hue                  = colorFg.h;
                chrom.fg_fill_saturation           = colorFg.s;
                chrom.fg_fill_lightness            = colorFg.l;
                chrom.fg_stroke_color_hue          = 0;

                // 相対値（changeA系）は使わないので0にリセット
                chrom.fg_repeat_changeA_hue        = 0;
                chrom.fg_repeat_changeA_saturation = 0;
                chrom.fg_repeat_changeA_lightness  = 0;

                // ★ 新設のバイパス：柄の2色目(colorB)の絶対値を直接プロパティに持たせる
                chrom._absolute_colorB = `hsl(${colorPattern.h}, ${colorPattern.s}%, ${colorPattern.l}%)`;
            });

            if (negativeColors.length > 0) {
                let colorRule = {
                    'weight': 1, 'severity': 0.2, 'target': new Object(), 'colorLocked': true,
                    'negativeColors': negativeColors.map(c => hueToDictScale(c.h))
                };
                evaluateRules.forEach(r => r.colorLocked = false);
                evaluateRules.push(colorRule);
            }
        }
        else if (positiveColors.length === 0 && negativeColors.length > 0) {
            let colorRule = {
                'weight': 1,
                'severity': 0.2,
                'target': new Object(),
                'colorLocked': true,
                'negativeColors': negativeColors.map(c => hueToDictScale(c.h))
            };
            evaluateRules.forEach(r => r.colorLocked = false);
            evaluateRules.push(colorRule);
            console.log(`[GA Penalty] 否定色相のみを登録:`, colorRule.negativeColors);
        }
    }

    // ==========================================
    // 図形・柄の処理
    // 肯定指定は即時強制書き換えで完結するため評価ルールには登録しない
    // 否定指定（「丸じゃなくして」等）のみ、継続的なペナルティとして評価ルールに登録する
    // ==========================================
    if (detectedFigures.length > 0 || detectedPatterns.length > 0) {
        const positiveFigureTypes = detectedFigures.filter(f => !f.negative).map(f => f.type);
        const negativeFigureTypes = detectedFigures.filter(f => f.negative).map(f => f.type);
        const positivePatternTypes = detectedPatterns.filter(p => !p.negative).map(p => p.type);
        const negativePatternTypes = detectedPatterns.filter(p => p.negative).map(p => p.type);

        // 否定指定がある場合のみ、減点ルールを評価ルールに登録（即時書き換えできないため）
        if (negativeFigureTypes.length > 0 || negativePatternTypes.length > 0) {
            let shapeRule = {
                'weight': 1,
                'severity': 0.2,
                'target': new Object(),
                'negativeFigures': negativeFigureTypes,
                'negativePatterns': negativePatternTypes
            };
            evaluateRules.push(shapeRule);
            console.log(`[GA Target: Shape] 否定図形・柄のペナルティルールを登録:`, shapeRule);
        }

        // 図形が2種類同時に肯定指定された場合（「丸と三角を使って」等）は
        // 1枚の画像内で両方を交互描画させるため fg_type / fg_type2 を直接書き換える
        if (positiveFigureTypes.length >= 2) {
            const [figA, figB] = positiveFigureTypes;
            console.log(`[Figure: Dual] 2種類の図形を交互描画するため fg_type=${figA}, fg_type2=${figB} に強制書き換え`);
            population.chroms.forEach(chrom => {
                chrom.fg_type = figA;
                chrom.fg_type2 = figB;
                chrom.fg_pattern = 'none'; // シルエットを見せるため柄は無地に
            });
        } else if (positiveFigureTypes.length === 1) {
            // 1種類のみの指定なら全個体を強制書き換え、fg_type2 もクリアして単一図形にする
            // fg_pattern が none 以外だと柄描画が優先されて図形が見えなくなるため必ず none にリセット
            const fig = positiveFigureTypes[0];
            console.log(`[Figure: Single] 全個体の図形を ${fig} に強制書き換え（柄を none にリセット）`);
            population.chroms.forEach(chrom => {
                chrom.fg_type = fig;
                chrom.fg_pattern = 'none';
                chrom.fg_type2 = null;
            });
            // 図形を固定：交叉時もこの図形を維持する
            evaluateRules.push({ weight: 0, severity: 0, target: {}, lockedFigure: fig, lockedPattern: 'none' });
        }

        // 柄が1種類だけ肯定指定された場合は全個体を強制書き換え
        if (positivePatternTypes.length >= 1) {
            const pat = positivePatternTypes[0];
            console.log(`[Pattern: Single] 全個体の柄を ${pat} に強制書き換え`);
            population.chroms.forEach(chrom => {
                chrom.fg_pattern = pat;
            });
            // 柄を固定：交叉時もこの柄を維持する
            evaluateRules.push({ weight: 0, severity: 0, target: {}, lockedPattern: pat });
        }
    }

    if (isRelativeDelta) {
        const parentShape = population.chroms[population.bestChromId].fg_type;
        console.log(`[shape] 相対変化: 元の図形タイプ(${parentShape})を維持し、セルサイズ・太さを相対調整します`);
        population.chroms.forEach(chrom => {
            chrom.fg_type = parentShape;
            
            if (deltaValue !== 0) {
                const ratio = 1 + deltaValue; 
                ['fg_size_x0', 'fg_size_x1', 'fg_size_x2', 'fg_size_y0', 'fg_size_y1', 'fg_size_y2'].forEach(key => {
                    let currentVal = Number(chrom[key] || 0);
                    let scale = (currentVal + 1) / 2;
                    let newScale = scale * ratio;
                    chrom[key] = Math.max(-0.95, Math.min(0.95, newScale * 2 - 1));
                });
                console.log(`[density] サイズ比率を ${ratio} 倍に調整しました`);
            }

            // 太さ変化：fg_stroke_width と fg_size_y0 を直接変化させる
            if (deltaThickness !== 0) {
                // 縁の太さ
                const currentSW = Number(chrom.fg_stroke_width || 0);
                const newSW = Math.max(0, Math.min(10, currentSW + deltaThickness * 5));
                chrom.fg_stroke_width = newSW;
                console.log(`[thickness] fg_stroke_width: ${currentSW.toFixed(2)} → ${newSW.toFixed(2)}`);

                // 図形の縦サイズ（細長い図形の太さ制御）
                const currentY0 = Number(chrom.fg_size_y0 || 0);
                const newY0 = Math.max(-0.95, Math.min(0.95, currentY0 + deltaThickness));
                chrom.fg_size_y0 = newY0;
                const currentY1 = Number(chrom.fg_size_y1 || 0);
                chrom.fg_size_y1 = Math.max(-0.95, Math.min(0.95, currentY1 + deltaThickness));
                console.log(`[thickness] fg_size_y0: ${currentY0.toFixed(3)} → ${newY0.toFixed(3)}`);
            }
        });
    }

    if (detectedNeon !== null) {
        population.chroms.forEach(chrom => {
            chrom.effect_neon = detectedNeon;
        });
    }

    if (currentZoom !== 1.0) {
        const zoomDelta = 0.15 * Math.log2(currentZoom);
        const ratio = 1.0 + zoomDelta;

        console.log(`[Zoom Feedback] ズーム率 ${currentZoom.toFixed(2)} -> 補正倍率: ${ratio.toFixed(2)}倍`);

        const parentFigure  = population.chroms[population.bestChromId].fg_type;
        const parentPattern = population.chroms[population.bestChromId].fg_pattern;
        
        population.chroms.forEach(chrom => {
            chrom.fg_type    = parentFigure; 
            chrom.fg_pattern = parentPattern;
            ['fg_size_x0', 'fg_size_x1', 'fg_size_x2', 'fg_size_y0', 'fg_size_y1', 'fg_size_y2'].forEach(key => {
                let currentVal = Number(chrom[key] || 0);
                let scale = (currentVal + 1) / 2;
                let newScale = scale * ratio;
                chrom[key] = Math.max(-0.95, Math.min(0.95, newScale * 2 - 1));
            });
        });
    }
}

// #MARK: F:setFitness
export function setFitnessScore(chrom) {
    let fitness = 0;
    evaluateRules.forEach(rule => {
        const weight = rule.weight;
        const severity = rule.severity;
        const targets = Object.entries(rule.target);
        let ruleScore = 0;
        
        targets.forEach(target => {
            const topicKey = target[0];
            const targetValues = target[1];
            const chromValues = getChromValue(chrom, topicKey);
            if(chromValues.length > 0) {
                let bestMatchScore = 0;
                let angleFlag = ["GBH", "GWA", "GFH", "GFR", "GSH", "GRD", "GRR"].includes(topicKey);

                targetValues.forEach(targetValue => {
                    chromValues.forEach(chromValue => {
                        let devitation = 0;
                        if(angleFlag) {
                            devitation = Math.pow(Math.sin(0.5 * (targetValue - chromValue)), 2);
                        } else {
                            devitation = Math.abs(targetValue - chromValue);
                        }
                        let currentScore = Math.pow(Math.E, (-921 * Math.pow(severity, 3) * Math.pow(devitation, 2)));
                        if (currentScore > bestMatchScore) {
                            bestMatchScore = currentScore;
                        }
                    });
                });
                ruleScore += weight * bestMatchScore;
            }
        });
        fitness += ruleScore;

        // ==========================================
        // 1. 肯定複数色の「網羅性（Coverage）」ジャッジ
        // ==========================================
        if (rule.target['GBH'] && rule.target['GBH'].length >= 2) {
            const requiredColors = rule.target['GBH']; 
            const currentBgH = hueToDictScale(Number(chrom.bgColor_hue));
            const currentFgH = hueToDictScale(Number(chrom.fg_fill_hue));
            let coveredColorCount = 0;
            
            requiredColors.forEach(tv => {
                let matchBg = Math.pow(Math.sin(0.5 * (tv - currentBgH)), 2) < 0.01;
                let matchFg = Math.pow(Math.sin(0.5 * (tv - currentFgH)), 2) < 0.01;
                if (matchBg || matchFg) coveredColorCount++;
            });

            if (coveredColorCount < requiredColors.length) {
                fitness -= 100; 
            }
        }

        // ==========================================
        // 2. 否定色の「完全排除（Avoidance）」ジャッジ
        // ==========================================
        if (rule.negativeColors && rule.negativeColors.length > 0) {
            const currentBgH = hueToDictScale(Number(chrom.bgColor_hue));
            const currentFgH = hueToDictScale(Number(chrom.fg_fill_hue));

            rule.negativeColors.forEach(tv => {
                let matchBg = Math.pow(Math.sin(0.5 * (tv - currentBgH)), 2) < 0.06;
                let matchFg = Math.pow(Math.sin(0.5 * (tv - currentFgH)), 2) < 0.06;
                if (matchBg || matchFg) {
                    fitness -= 80; 
                }
            });
        }

        // ==========================================
        // 3. 図形・柄の「自律進化 ＆ 完全排除」ジャッジ
        // ==========================================
        // 否定の図形・柄のみ評価ルールとして残る（肯定は即時書き換え済みのためここには来ない）
        if (rule.negativeFigures && rule.negativeFigures.length > 0) {
            if (rule.negativeFigures.includes(chrom.fg_type)) {
                fitness -= 80.0;
            }
        }
        if (rule.negativePatterns && rule.negativePatterns.length > 0) {
            if (rule.negativePatterns.includes(chrom.fg_pattern)) {
                fitness -= 80.0;
            }
        }
    });

    const hasDarkRule = evaluateRules.some(r => {
        const wantsDarkBg = r.target['GBL'] && r.target['GBL'].some(v => v < -0.4); 
        const wantsDarkFg = r.target['GFL'] && r.target['GFL'].some(v => v < -0.4);
        return wantsDarkBg || wantsDarkFg;
    });

    if (!hasDarkRule) {
        const bgLit = Number(chrom.bgColor_lightness);
        const fgLit = Number(chrom.fg_fill_lightness);
        
        if (bgLit < 30 && fgLit < 30) {
            fitness -= 10; 
        } else if (bgLit < 20 || fgLit < 20) {
            fitness -= 5;
        }
    }

    chrom._fitness = fitness;
}

// getChromValue で使う topicKey と遺伝子情報の紐づけ
const chromKeys = {
    "GBH": ["bgColor_hue", "bgGradient_color_hue"],
    "GBS": ["bgColor_saturation", "bgGradient_color_saturation"],
    "GBL": ["bgColor_lightness", "bgGradient_color_lightness"],
    "GGC": ["bgGradient_center_x", "bgGradient_center_y"],
    "GWL": ["bgGradient_wave_len"],
    "GwA": ["bgGradient_wave_angle"],
    "GWS": ["bgGradient_colorStop_0", "bgGradient_colorStop_1"],
    "GCX": ["fg_repeat_origin_x"],
    "GCY": ["fg_repeat_origin_y"],
    "GFR": ["fg_repeat_rotate_origin"],
    "GFZ": ["_calculated|shapeSize"],
    "GFY": ["fg_size_y0"],
    "GFX": ["fg_size_x0"],
    "GFH": ["fg_fill_hue", "_calculated|fgRepeatChangeColorPHue", "_calculated|fgRepeatChangeColorQHue"],
    "GFS": ["fg_fill_saturation", "_calculated|fgRepeatChangeColorPSaturation", "_calculated|fgRepeatChangeColorQSaturation"],
    "GFL": ["fg_fill_lightness", "_calculated|fgRepeatChangeColorPLightness", "_calculated|fgRepeatChangeColorQLightness"],
    "GFA": ["fg_fill_alpha"],
    "GSH": ["_calculated|fgStrokeColorHue"],
    "GSS": ["_calculated|fgStrokeColorSaturation"],
    "GSL": ["_calculated|fgStrokeColorLightness"],
    "GSA": ["_calculated|fgStrokeColorAlpha"],
    "GSW": ["fg_stroke_width"],
    "GRD": ["fg_repeat_direction_vat", "fg_repeat_direction_vby"],
    "GRC": ["fg_repeat_count_va", "fg_repeat_count_vb"],
    "GRR": ["fg_repeat_rotate_va", "fg_repeat_rotate_vb"],
    "GRZ": ["_calculated|fgRepeatResizeP", "_calculated|fgRepeatResizeQ"],
    "GRH": ["fg_repeat_changeA_hue", "fg_repeat_changeB_hue"],
    "GRS": ["fg_repeat_changeA_saturation", "fg_repeat_changeB_saturation"],
    "GRL": ["fg_repeat_changeA_lightness", "fg_repeat_changeB_lightness"],
    "ICA": ["_impression|ICA"],
    "ICE": ["_impression|ICE"],
    "IAL": ["_impression|IAL"],
    "IAB": ["_impression|IAB"],
    "IBT": ["_impression|IBT"],
    "IWM": ["_impression|IWM"],
    "ISH": ["_impression|ISH"],
    "ISM": ["_impression|ISM"]
};

const hueLikeKeys = new Set(['GBH', 'GFH', 'GSH', 'GRH']);
const pureAngleKeys = new Set(['GWA', 'GFR', 'GRD', 'GRR']);

// #MARK: F:gtChrmValue
function getChromValue(chrom, topicKey) {
    let values = [];
    if(chromKeys[topicKey]) {
        let keyAddress = chromKeys[topicKey];
        keyAddress.forEach(address => {
            let addressArray = address.split('|');
            let chromValue;
            if(addressArray.length == 1) {
                chromValue = chrom[addressArray[0]];
            } else if(addressArray.length == 2) {
                // _calculated は drawCanvas 後に設定される。初期生成時は未定義のため 0 を返す
                if (chrom[addressArray[0]] === undefined) {
                    chromValue = 0;
                } else {
                    chromValue = chrom[addressArray[0]][addressArray[1]];
                }
            }
            if(DEBUG_GCV) {
                console.log(chromValue);
                if(isNaN(chromValue)) debugger;
            }
            if (hueLikeKeys.has(topicKey)) {
                chromValue = hueToDictScale(Number(chromValue));
            } else if (pureAngleKeys.has(topicKey)) {
                chromValue = (((Number(chromValue) + 360) % 360) / 180) - 1;
            } else if(
                (topicKey == 'GBS') || (topicKey == 'GBL') || (topicKey == 'GFS') ||
                (topicKey == 'GFL') || (topicKey == 'GFA') || (topicKey == 'GSS') ||
                (topicKey == 'GSL') || (topicKey == 'GSA')
            ) {
                chromValue = Number(chromValue) / 50 - 1;
            } else if(topicKey == 'GRC') {
                chromValue = Number(chromValue) / 10 - 1;
            } else if(topicKey == 'GSW') {
                chromValue = Number(chromValue) / 5 - 1;
            } else if(topicKey == 'GRZ') {
                chromValue = Number(chromValue) / 2 - 1;
            } else if(topicKey == 'GWL') {
                chromValue = Number(chromValue) - 1;
            } else if(topicKey == 'GWS') {
                chromValue = Number(chromValue) * 2 - 1;
            } else if(
                (topicKey == 'GRS') || (topicKey == 'GRL')
            ) {
                chromValue = Number(chromValue) / 4;
            } else if(topicKey == 'GGC') {
                chromValue = Number(chromValue) / 2;
            } else if(topicKey == 'GFZ') {
                chromValue = Number(chromValue) / 1;
            } else if(topicKey == 'GFY') {
                chromValue = Number(chromValue);
            } else if(topicKey == 'GFX') {
                chromValue = Number(chromValue);
            } else if((topicKey == 'GCX') || (topicKey == 'GCY')) {
                chromValue = Number(chromValue) / 3 * 5;
            }
            values.push(chromValue);
        });
    }
    return values;
}

function compoundTokens(token0, token1, pos = '文節', pos_detail_1 = '*') {
    const compoundToken = new Object();
    compoundToken.word_id = '*';
    compoundToken.word_type = 'COMPOUNDED';
    compoundToken.word_position = token0.word_position;
    compoundToken.surface_form = token0.surface_form + token1.surface_form;
    if(
        (token1.conjugated_type == '特殊・ナイ') ||
        (token1.conjugated_type == '特殊・ヌ')
    ) {
        compoundToken.basic_form = (token0.basic_form == '*' ? token0.surface_form : token0.basic_form);
        compoundToken.negative = true;
    } else if(token0.negative) {
        compoundToken.basic_form = token0.basic_form + (token1.basic_form == '*' ? token1.surface_form : token1.basic_form);
        compoundToken.negative = true;
    } else {
        compoundToken.basic_form = token0.surface_form + (token1.basic_form == '*' ? token1.surface_form : token1.basic_form);
    }
    compoundToken.pos = pos;
    compoundToken.pos_detail_1 = pos_detail_1;
    if(
        (token1.reading == 'スギル' || (token1.reading && token1.reading.startsWith('スギ')))
    ) {
        compoundToken.over = true;
        compoundToken.surface_form = token0.surface_form;
        if (token0.pos === '形容詞') {
            const bf = token0.basic_form !== '*' ? token0.basic_form : token0.surface_form;
            compoundToken.basic_form = bf.endsWith('い') ? bf : bf + 'い';
        } else {
            compoundToken.basic_form = token0.basic_form !== '*' ? token0.basic_form : token0.surface_form;
        }
        compoundToken.word_type = token0.word_type;
        compoundToken.pos_detail_2 = '*';
        compoundToken.pos_detail_3 = '*';
        compoundToken.conjugated_form = token0.conjugated_form;
        compoundToken.conjugated_type = token0.conjugated_type;
        compoundToken.reading = (token0.reading ?? token0.surface_form);
        compoundToken.pronunciation = (token0.pronunciation ?? token0.surface_form);
    } else {
        compoundToken.pos_detail_2 = '*';
        compoundToken.pos_detail_3 = '*';
        compoundToken.conjugated_form = token1.conjugated_form;
        compoundToken.conjugated_type = token1.conjugated_type;
        compoundToken.reading = (token0.reading ?? token0.surface_form) + (token1.reading ?? token1.surface_form);
        compoundToken.pronunciation = (token0.pronunciation ?? token0.surface_form) + (token1.pronunciation ?? token1.surface_form);
    }
    let token0Children = token0.children ?? [token0];
    let token1Children = token1.children ?? [token1];
    compoundToken.children = token0Children.concat(token1Children);
    return compoundToken;
}

// #MARK: F: matchDB
async function matchDatabase(phrase, allowSimilarity = true) {
    let foundFlag = false;
    let topicData = [];
    let detectedFigureType = null;
    let detectedPatternType = null;
    let isDeltaFlag = false;

    const shapeKeywords = Object.keys(figureTypeDict).concat(Object.keys(patternTypeDict)).sort((a, b) => b.length - a.length);
    for (const keyword of shapeKeywords) {
        if (phrase === keyword || phrase.includes(keyword)) {
            detectedFigureType = figureTypeDict[keyword] || null;
            detectedPatternType = patternTypeDict[keyword] || null;
            foundFlag = true;
            break;
        }
    }

    // topic照合
    for(let i = 0; i < dics.topicKeys.length; i++) {
        if(phrase.match(dics.topicKeys[i])) {
            if(DEBUG_MDB) console.log(dics.topicKeys[i] + 'が言及対象辞書でヒットした: ' + `id: ${i} (${phrase}, ${dics.topic[dics.topicKeys[i]]})`);
            topicData = dics.topic[dics.topicKeys[i]];
            foundFlag = true;
            break;
        }
    }
    if (topicData.length === 0) {
        for(let len = Math.min(phrase.length - 1, 3); len >= 1; len--) {
            const shortPhrase = phrase.slice(0, len);
            for(let i = 0; i < dics.topicKeys.length; i++) {
                if(shortPhrase === dics.topicKeys[i]) {
                    if(DEBUG_MDB) console.log(dics.topicKeys[i] + 'が言及対象辞書でヒットした（短縮）: ' + `(${phrase}→${shortPhrase})`);
                    topicData = dics.topic[dics.topicKeys[i]];
                    foundFlag = true;
                    break;
                }
            }
            if (topicData.length > 0) break;
        }
    }

    let conditionData = new Object();
    let colorMatched = false;
    let colorSeverityBoost = 1;
    let detectedHue = null;
    let detectedSaturation = null;
    let detectedLightness = null;

    let phraseForColor = phrase;
    for (const keyword of shapeKeywords) {
        if (phraseForColor.includes(keyword)) {
            phraseForColor = phraseForColor.replace(keyword, '');
        }
    }
    phraseForColor = phraseForColor.replace(/色$/, '');

    // ① 色辞書照合
    for(let i = dics.color.length - 1; i > 0; i--) {
        const color = dics.color[i];
        let colorMatchFlag = false;
        for(let j = 0; j < color.name.length; j++) {
            if(phraseForColor && phraseForColor.match(color.name[j])) {
                if(DEBUG_MDB) console.log(color.name[j] + 'が色辞書でヒットした: ' + `id: ${i}（元: ${phrase}, 判定: ${phraseForColor}, ${JSON.stringify(color.hsl)}）`);
                colorMatchFlag = true;
                foundFlag = true;
                colorMatched = true;
            }
        }
        if (colorMatchFlag) {
            let h = hueToDictScale(color.hsl[0]);
            let s = color.hsl[1] / 50 - 1;
            let l = color.hsl[2] / 50 - 1;
            ["GBH", "GFH", "GRH", "GSH"].forEach(keyName => { conditionData[keyName] = h; });
            ["GBS", "GFS", "GRS", "GSS"].forEach(keyName => { conditionData[keyName] = s; });
            ["GBL", "GFL", "GRL", "GSL"].forEach(keyName => { conditionData[keyName] = l; });
            colorSeverityBoost = 5;
            detectedHue        = color.hsl[0];
            detectedSaturation = color.hsl[1];
            detectedLightness  = color.hsl[2];
            break;
        }
    }

    // 程度表現照合
    let adjustSeverity = 1;
    let isSeverityWord = false;
    for(let i = 0; i < adjustSeverityTable.length; i++) {
        if(phrase.match(adjustSeverityTable[i][0])) {
            adjustSeverity = adjustSeverityTable[i][1];
            if(DEBUG_MDB) console.log(`重要度補正：${adjustSeverity} （${adjustSeverityTable[i][0]}）`);
            foundFlag = true;
            isSeverityWord = true;
            break;
        }
    }

    if (!colorMatched && !isSeverityWord && topicData.length === 0 && detectedFigureType === null && detectedPatternType === null) {
        
        let isDensityMatch = false;
        for (const [keyword, conditions] of Object.entries(densityDict)) {
            if (phrase === keyword || phrase.includes(keyword)) {
                conditionData = Object.assign({}, conditions);
                topicData = ['GFZ', 'GRC', 'GFX', 'GFY'];
                foundFlag = true;
                isDensityMatch = true;
                isDeltaFlag = true;
                if(DEBUG_MDB) console.log(`[density] "${phrase}" → サイズ・密度指定(相対値):`, conditions);
                break;
            }
        }

        let isThicknessMatch = false;
        if (!isDensityMatch) {
            for (const [keyword, conditions] of Object.entries(thicknessDict)) {
                if (phrase === keyword || phrase.includes(keyword)) {
                    conditionData = Object.assign({}, conditions);
                    topicData = ['GFY', 'GSW'];
                    foundFlag = true;
                    isThicknessMatch = true;
                    isDeltaFlag = true;
                    if(DEBUG_MDB) console.log(`[thickness] "${phrase}" → 太さ指定(相対値):`, conditions);
                    break;
                }
            }
        }

        let isEmoMatch = false;
        if (!isDensityMatch && !isThicknessMatch) {
            for (const [keyword, conditions] of Object.entries(emoDict)) {
                if (phrase === keyword || phrase.includes(keyword)) {
                    conditionData = Object.assign({}, conditions);
                    topicData = Object.keys(conditions);
                    foundFlag = true;
                    isEmoMatch = true;
                    isDeltaFlag = true;
                    if(DEBUG_MDB) console.log(`[emo] "${phrase}" → エモさ指定(相対値):`, conditions);
                    break;
                }
            }
        }

        if (!isDensityMatch && !isThicknessMatch && !isEmoMatch) {
            const exactMatch = dics.condition[phrase];
            const shortMatch = !exactMatch && dics.conditionKeys.find(key => phrase.startsWith(key) && key.length >= 2);
            if (exactMatch) {
                conditionData = Object.assign({}, dics.condition[phrase]);
                foundFlag = true;
                if(DEBUG_MDB) console.log(`[matchDB] "${phrase}" が完全一致`);
            } else if (shortMatch) {
                conditionData = Object.assign({}, dics.condition[shortMatch]);
                foundFlag = true;
                if(DEBUG_MDB) console.log(`[matchDB] "${phrase}" → "${shortMatch}" で部分一致`);
            } else {
                
                if (!allowSimilarity) {
                     if(DEBUG_MDB) console.log(`[similarity] "${phrase}" の類似度計算を抑制しました（フラグOFF）`);
                     return { found: false, topic: [], condition: {}, adjustSeverity: 1, colorLocked: false, detectedHue: null, detectedSaturation: null, detectedLightness: null, detectedFigureType: null, detectedPatternType: null, isDelta: false, isNeon: false };
                }

                const similarityTargetKeys = dics.conditionKeys.filter(key => {
                    const cond = dics.condition[key];
                    const keys = Object.keys(cond);
                    return !(keys.length === 1 && keys[0] === 'FGD');
                });
                
                const repColorsKeys = Object.keys(repColorConditions);
                similarityTargetKeys.push(...repColorsKeys);

                const similar = await getSimilarWords(phrase, similarityTargetKeys, 5, 0.5);
                if (similar.length > 0) {
                    foundFlag = true;
                    if(DEBUG_MDB) console.log(`[similarity] "${phrase}" の類似語:`, similar);
                    const totalScore = similar.reduce((sum, { score }) => sum + score, 0);
                    
                    let firstColorHit = false;

                    similar.forEach(({ word, score }) => {
                        // 色辞書(repColors)からのヒットかチェック
                        if (repColors[word] && !firstColorHit) {
                            colorMatched = true;
                            colorSeverityBoost = 5;
                            detectedHue = repColors[word][0];
                            detectedSaturation = repColors[word][1];
                            detectedLightness = repColors[word][2];
                            firstColorHit = true;
                            if(DEBUG_MDB) console.log(`[similarity:Color] "${phrase}" から色類似語 "${word}" を採用しました`);
                        }

                        const cond = repColorConditions[word] || dics.condition[word];
                        if (cond) {
                            Object.entries(cond).forEach(([key, value]) => {
                                if (conditionData[key] === undefined) conditionData[key] = 0;
                                conditionData[key] += value * (score / totalScore);
                            });
                        }
                    });
                }
            }
        }
    }

    let isNeonFlag = false;
    if (phrase.includes('ネオン') || phrase.includes('発光') || phrase.includes('サイバー') || phrase.includes('光る')) {
        isNeonFlag = true;
    }

    return {
        found: foundFlag,
        topic: topicData,
        condition: conditionData,
        adjustSeverity: adjustSeverity * colorSeverityBoost,
        colorLocked: colorMatched,
        detectedHue: detectedHue,
        detectedSaturation: detectedSaturation,
        detectedLightness: detectedLightness,
        detectedFigureType: detectedFigureType,
        detectedPatternType: detectedPatternType,
        isDelta: isDeltaFlag,
        isNeon: isNeonFlag
    };
}