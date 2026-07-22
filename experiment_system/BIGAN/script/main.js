import * as Population from "./_population.js";
import appendGenCycle from "./_appendGenCycle.js";
import drawCanvas, { setupCanvasCamera } from "./_drawCanvas.js";
import getImpression from "./_getImpression.js";
import { setFitnessScore, makeEvaluateRule, analyzeInitialText } from "./_evaluate.js";
import getTables from "./_getTables.js";
import * as Estimation from "./_estimation.js";
import { loadModel, preloadDictVectors } from "./_similarity.js";

export const dics = new Object();
export const evaluateRules = [];

const isAvailableEstimation = true;

// ★ 実験ログ（入力履歴）を貯めておくための配列を追加
window.experimentLogs = [];

// #MARK: 初期処理
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('toggleManual').addEventListener('click', () => {
        document.getElementById('manualPopup').classList.toggle('hidden');
    });

    getTables().then(async (data) => {
        dics.color = data.colorDic;
        dics.textReplacementPairs = data.textReplacementPairs;
        dics.topic = data.topic2EvaluateItems;
        dics.topicKeys = Object.keys(dics.topic);
        dics.condition = data.conditionValues;
        dics.conditionKeys = Object.keys(dics.condition);
        console.log(dics);

        const elemMsg = document.getElementById('msg-ReadFiles');
        elemMsg.innerText = 'AIモデルを読み込み中...';
        await loadModel();

        await preloadDictVectors(dics.conditionKeys, (done, total) => {
            elemMsg.innerText = `辞書をベクトル化中... ${done} / ${total}`;
        });

        elemMsg.remove();

        main();
    });
});

// #MARK: F: main
function main() {
    if(isAvailableEstimation) {
        Estimation.enableEstimation();
    }

    // #MARK: | 最初のイメージ入力エリアを表示
    const elemMain = document.querySelector('main');
    const initialSection = document.createElement('section');
    initialSection.classList.add('genCycle');
    initialSection.innerHTML = `
        <div class="userEvaluate">
            <div class="titleBar">
                <h3>最初のイメージを教えてください</h3>
                <img id="msg-initialEvaluate" class="msg-evaluate" src="assets/images/loading.svg" style="display:none">
                <span class="msg-loading" id="msg-loadKuromoji">必要なファイルを読み込んでいます...</span>
                <button id="btn-initialEvaluate" disabled>この内容で生成</button>
            </div>
            <div class="userEvaluate-inner" id="initialEvaluate-inner">
                <textarea id="area-initialEvaluate" rows="" placeholder="例：「青いストライプ柄が欲しい」「丸と三角を使ってほしい」など。空欄のまま決定すると完全ランダムで生成します。"></textarea>
            </div>
        </div>`;
    elemMain.appendChild(initialSection);

    let kuromojiTokenizer;
    let isTokenizerReady = false;
    let elemMsgKuromoji = document.getElementById('msg-loadKuromoji');
    kuromoji.builder({dicPath: "./assets/dict/"}).build(function (err, tokenizer) {
        console.log("tokenizerBuild", "tokenizer is ready");
        kuromojiTokenizer = tokenizer;
        isTokenizerReady = true;
        elemMsgKuromoji.innerText = '準備完了';
        elemMsgKuromoji.classList.remove('msg-loading');
        document.getElementById('btn-initialEvaluate').removeAttribute('disabled');
        document.getElementById('area-initialEvaluate').focus();
    });

    const elemInitialBtn = document.getElementById('btn-initialEvaluate');
    const elemInitialTextarea = document.getElementById('area-initialEvaluate');
    const elemInitialMsg = document.getElementById('msg-initialEvaluate');

    elemInitialBtn.addEventListener('click', async () => {
        elemInitialTextarea.setAttribute('disabled', '');
        elemInitialBtn.setAttribute('disabled', '');
        elemInitialMsg.style.display = 'inline-block';

        const initialText = elemInitialTextarea.value;
        
        // ★ 初期入力のログを記録
        window.experimentLogs.push(`世代: 0 (初期入力), 評価文: ${initialText || "（空欄・完全ランダム）"}`);

        let analysis = null;
        if (initialText && initialText.trim()) {
            analysis = await analyzeInitialText(kuromojiTokenizer, initialText);
        }

        elemInitialMsg.style.display = 'none';
        elemInitialTextarea.removeAttribute('disabled');

        startGeneration(kuromojiTokenizer, initialText);
    });
}

// #MARK: F: startGeneration
async function startGeneration(kuromojiTokenizer, initialText) {
    appendGenCycle(1);
    document.getElementById(`msg-userEvaluate_1`).style.display = 'none';
    let elemFirstEvaluateBtn = document.getElementById('btn-evaluate_1');
    elemFirstEvaluateBtn.setAttribute('disabled', '');

    let initialChroms = Population.getInit();
    let population = {
        "index": 1,
        "bestChromId": 0,
        "pickupChromId": 1,
        "chroms": initialChroms
    };

    if (initialText && initialText.trim()) {
        await makeEvaluateRule(kuromojiTokenizer, initialText, population, 1.0);
        evaluateRules.length = 0;
        console.log('[Initial] makeEvaluateRule による初期集団の強制書き換えが完了しました');
    }

    let firstGenDrawCount = 0;
    const elemMsgGenerating = document.getElementById(`msg-userEvaluate_1`);
    const intervalId = setInterval(() => {
        if(firstGenDrawCount < Population.POPULATION_SIZE) {
            const newCanvas = document.createElement("canvas");
            newCanvas.id = `cv_1_${firstGenDrawCount}`;
            newCanvas.setAttribute('width', 512);
            newCanvas.setAttribute('height', 384);
            drawCanvas(newCanvas, population.chroms[firstGenDrawCount]);
            let impression = getImpression(newCanvas, population.chroms[firstGenDrawCount]);
            if(impression.colors.length != 1) {
                if(
                    (firstGenDrawCount == population.bestChromId) ||
                    (firstGenDrawCount == population.pickupChromId)
                ) {
                    const isLeft = (firstGenDrawCount == population.bestChromId);
                    
                    // 第1世代のドロップ受け入れ設定（カメラ破棄の置換処理込み）
                    function attachDrop(canvasElem, isLeftNode) {
                        canvasElem.addEventListener('dragover', (e) => {
                            e.preventDefault();
                            canvasElem.style.boxShadow = isLeftNode ? "0 0 15px 5px #ff8c00" : "0 0 15px 5px #008cff";
                        });
                        canvasElem.addEventListener('dragleave', () => {
                            canvasElem.style.boxShadow = "none";
                        });
                        canvasElem.addEventListener('drop', (e) => {
                            e.preventDefault();
                            const draggedChromId = parseInt(e.dataTransfer.getData('text/plain'), 10);
                            if (!isNaN(draggedChromId)) {
                                if (isLeftNode) {
                                    population.bestChromId = draggedChromId;
                                } else {
                                    population.pickupChromId = draggedChromId;
                                }
                                
                                const freshCanvas = document.createElement("canvas");
                                freshCanvas.id = canvasElem.id;
                                freshCanvas.setAttribute('width', 512);
                                freshCanvas.setAttribute('height', 384);
                                canvasElem.replaceWith(freshCanvas);
                                
                                drawCanvas(freshCanvas, population.chroms[draggedChromId]);
                                setupCanvasCamera(freshCanvas, population.chroms[draggedChromId]);
                                attachDrop(freshCanvas, isLeftNode);
                                
                                // グリッドの選択状態を更新（もし表示されていれば）
                                if (window.updateGridSelection_1) window.updateGridSelection_1();
                            }
                        });
                    }
                    attachDrop(newCanvas, isLeft);

                    document.getElementById('compareImages_1').appendChild(newCanvas);
                    setupCanvasCamera(newCanvas, population.chroms[firstGenDrawCount]);
                }
                population.chroms[firstGenDrawCount]._impression = JSON.parse(JSON.stringify(impression));
                firstGenDrawCount++;
            } else {
                population.chroms[firstGenDrawCount] = Population.getRandomIndividual();
            }
        } else {
            clearInterval(intervalId);
            document.getElementById('area-userEvaluate_1').focus();
            enableEvaluateBtn(population, kuromojiTokenizer);
            console.log(`%cpopulation: `, `color: #f88`);
            console.log(JSON.parse(JSON.stringify(population)));
        }
    }, 5);
}

// #MARK: F: setupLockButtons
function setupLockButtons(population) {
    const genCount = population.index;

    const lockState = { L: { figure: false, color: false, pattern: false }, R: { figure: false, color: false, pattern: false } };

    function removeLockRules(type) {
        for (let i = evaluateRules.length - 1; i >= 0; i--) {
            if (type === 'figure'  && evaluateRules[i].lockedFigure  !== undefined) evaluateRules.splice(i, 1);
            if (type === 'color'   && evaluateRules[i].lockedColor   !== undefined) evaluateRules.splice(i, 1);
            if (type === 'pattern' && evaluateRules[i].lockedPattern !== undefined) evaluateRules.splice(i, 1);
            if (type === 'all') {
                if (
                    evaluateRules[i].lockedFigure  !== undefined ||
                    evaluateRules[i].lockedColor   !== undefined ||
                    evaluateRules[i].lockedPattern !== undefined
                ) evaluateRules.splice(i, 1);
            }
        }
    }

    ['L', 'R'].forEach(side => {
        const sideLabel = side === 'L' ? '左' : '右';

        const btnFigure  = document.getElementById(`btn-lockFigure_${genCount}_${side}`);
        const btnColor   = document.getElementById(`btn-lockColor_${genCount}_${side}`);
        const btnPattern = document.getElementById(`btn-lockPattern_${genCount}_${side}`);
        const btnAll     = document.getElementById(`btn-lockAll_${genCount}_${side}`);

        function updateButtonStyles() {
            btnFigure.classList.toggle('btn-lock--active', lockState[side].figure);
            btnColor.classList.toggle('btn-lock--active', lockState[side].color);
            btnPattern.classList.toggle('btn-lock--active', lockState[side].pattern);
        }

        btnFigure.addEventListener('click', () => {
            lockState[side].figure = !lockState[side].figure;
            removeLockRules('figure');
            if (lockState[side].figure) {
                // クリックされた時点の最新の親を取得
                const currentChrom = side === 'L' ? population.chroms[population.bestChromId] : population.chroms[population.pickupChromId];
                const fig = currentChrom.fg_type;
                evaluateRules.push({ weight: 0, severity: 0, target: {}, lockedFigure: fig, lockedPattern: currentChrom.fg_pattern });
                console.log(`[Lock] ${sideLabel}の形を固定: ${fig}`);
                btnFigure.textContent = `🔒 形 (${fig})`;
            } else {
                btnFigure.textContent = '🔺 形';
            }
            updateButtonStyles();
        });

        btnColor.addEventListener('click', () => {
            lockState[side].color = !lockState[side].color;
            removeLockRules('color');
            if (lockState[side].color) {
                const currentChrom = side === 'L' ? population.chroms[population.bestChromId] : population.chroms[population.pickupChromId];
                const h = Number(currentChrom.bgColor_hue);
                const s = Number(currentChrom.bgColor_saturation);
                const l = Number(currentChrom.bgColor_lightness);
                evaluateRules.push({ weight: 0, severity: 0, target: {}, lockedColor: { h, s, l } });
                console.log(`[Lock] ${sideLabel}の色を固定: H:${h}`);
                btnColor.textContent = `🔒 色`;
            } else {
                btnColor.textContent = '🎨 色';
            }
            updateButtonStyles();
        });

        btnPattern.addEventListener('click', () => {
            lockState[side].pattern = !lockState[side].pattern;
            removeLockRules('pattern');
            if (lockState[side].pattern) {
                const currentChrom = side === 'L' ? population.chroms[population.bestChromId] : population.chroms[population.pickupChromId];
                const pat = currentChrom.fg_pattern;
                evaluateRules.push({ weight: 0, severity: 0, target: {}, lockedPattern: pat });
                console.log(`[Lock] ${sideLabel}の柄を固定: ${pat}`);
                btnPattern.textContent = `🔒 柄 (${pat})`;
            } else {
                btnPattern.textContent = '🔲 柄';
            }
            updateButtonStyles();
        });

        btnAll.addEventListener('click', () => {
            lockState[side].figure = true;
            lockState[side].color  = true;
            lockState[side].pattern = true;
            removeLockRules('all');
            
            const currentChrom = side === 'L' ? population.chroms[population.bestChromId] : population.chroms[population.pickupChromId];
            const fig = currentChrom.fg_type;
            const pat = currentChrom.fg_pattern;
            const h = Number(currentChrom.bgColor_hue);
            const s = Number(currentChrom.bgColor_saturation);
            const l = Number(currentChrom.bgColor_lightness);
            
            evaluateRules.push({ weight: 0, severity: 0, target: {}, lockedFigure: fig, lockedPattern: pat });
            evaluateRules.push({ weight: 0, severity: 0, target: {}, lockedColor: { h, s, l } });
            console.log(`[Lock] ${sideLabel}の全てを固定`);
            btnFigure.textContent  = `🔒 形 (${fig})`;
            btnColor.textContent   = `🔒 色`;
            btnPattern.textContent = `🔒 柄 (${pat})`;
            updateButtonStyles();
        });
    });

    // 解除ボタン（左右共通）
    const btnRelease = document.getElementById(`btn-lockRelease_${genCount}`);
    btnRelease.addEventListener('click', () => {
        ['L', 'R'].forEach(side => {
            lockState[side].figure  = false;
            lockState[side].color   = false;
            lockState[side].pattern = false;
            const s = side;
            const btnF = document.getElementById(`btn-lockFigure_${genCount}_${s}`);
            const btnC = document.getElementById(`btn-lockColor_${genCount}_${s}`);
            const btnP = document.getElementById(`btn-lockPattern_${genCount}_${s}`);
            if (btnF) { btnF.textContent = '🔺 形'; btnF.classList.remove('btn-lock--active'); }
            if (btnC) { btnC.textContent = '🎨 色'; btnC.classList.remove('btn-lock--active'); }
            if (btnP) { btnP.textContent = '🔲 柄'; btnP.classList.remove('btn-lock--active'); }
        });
        removeLockRules('all');
        console.log('[Lock] 全ての固定を解除');
    });
}

function enableEvaluateBtn(population, kuromojiTokenizer) {
    let elemEvaluateBtn = document.getElementById(`btn-evaluate_${population.index}`);
    let elemMsgEvaluate = document.getElementById(`msg-userEvaluate_${population.index}`);
    elemEvaluateBtn.removeAttribute('disabled');
    setupLockButtons(population);

    elemEvaluateBtn.addEventListener('click', () => {
        // #MARK: 評価
        let elemAreaUserEvaluate = document.getElementById(`area-userEvaluate_${population.index}`);
        let evaluateText = elemAreaUserEvaluate.value;

        // ★ 各世代の評価文をログに記録
        window.experimentLogs.push(`世代: ${population.index}, 評価文: ${evaluateText || "（空欄）"}`);

        elemAreaUserEvaluate.setAttribute('disabled', '');
        elemMsgEvaluate.style.display = 'inline-block';
        
        let currentZoom = 1.0;
        const bestCanvas = document.getElementById(`cv_${population.index}_0`);
        if (bestCanvas && bestCanvas.__cameraState) {
            currentZoom = bestCanvas.__cameraState.zoom;
        }

        setTimeout(async () => {
            await makeEvaluateRule(kuromojiTokenizer, evaluateText, population, currentZoom); 
            population.chroms.forEach((chrom, i) => {
                setFitnessScore(chrom);
            });
            population = Population.crossover(population, evaluateRules);
            appendGenCycle(population.index);

            for(let i = 0; i < population.chroms.length; i++) {
                const newCanvas = document.createElement("canvas");
                newCanvas.id = `cv_${population.index}_${i}`;
                newCanvas.setAttribute('width', 512);
                newCanvas.setAttribute('height', 384);
                drawCanvas(newCanvas, population.chroms[i]);
                let impression = getImpression(newCanvas, population.chroms[i]);
                population.chroms[i]._impression = JSON.parse(JSON.stringify(impression));
                
                setFitnessScore(population.chroms[i]);
                
                if (population.chroms[i]._impression.colors && population.chroms[i]._impression.colors.length <= 1) {
                    population.chroms[i]._fitness -= 10000;
                }
            }

            population.chroms.sort((a, b) => b._fitness - a._fitness);
            population.bestChromId = 0;

            let minDist = 0.5;
            const bestChrom = population.chroms[population.bestChromId];
            const genParamKeys = Object.keys(Population.PARAMS);
            population.pickupChromId = population.chroms.length - 1;
            for(let i = population.chroms.length - 1; i > 0; i--) {
                if(i != population.bestChromId) {
                    const checkChrom = population.chroms[i];
                    let dist2BestChrom = 0;
                    for(let j = 0; j < genParamKeys.length; j++) {
                        let paramKeyName = genParamKeys[j];
                        let bestChromValue = fixChromString(bestChrom[paramKeyName]);
                        let checkChromValue = fixChromString(checkChrom[paramKeyName]);
                        let range = Population.PARAMS[paramKeyName][1] - Population.PARAMS[paramKeyName][0];
                        dist2BestChrom += Math.abs(bestChromValue - checkChromValue) / range;
                    }
                    if(
                        (dist2BestChrom > minDist) &&
                        (checkChrom._impression.colors.length > 1)
                    ) {
                        population.pickupChromId = i;
                    }
                }
            }

            [population.bestChromId, population.pickupChromId].forEach((chromId, i) => {
                const newCanvas = document.createElement("canvas");
                newCanvas.id = `cv_${population.index}_${i}`;
                newCanvas.setAttribute('width', 512);
                newCanvas.setAttribute('height', 384);
                drawCanvas(newCanvas, population.chroms[chromId]);

                // 第2世代以降のドロップ受け入れ設定（カメラ破棄の置換処理込み）
                function attachDrop2(canvasElem, isLeftNode) {
                    canvasElem.addEventListener('dragover', (e) => {
                        e.preventDefault(); 
                        canvasElem.style.boxShadow = isLeftNode ? "0 0 15px 5px #ff8c00" : "0 0 15px 5px #008cff";
                    });
                    canvasElem.addEventListener('dragleave', () => {
                        canvasElem.style.boxShadow = "none";
                    });
                    canvasElem.addEventListener('drop', (e) => {
                        e.preventDefault();
                        canvasElem.style.boxShadow = "none";
                        const draggedChromId = parseInt(e.dataTransfer.getData('text/plain'), 10);
                        if (!isNaN(draggedChromId)) {
                            if (isLeftNode) {
                                population.bestChromId = draggedChromId;
                            } else {
                                population.pickupChromId = draggedChromId;
                            }
                            
                            const freshCanvas = document.createElement("canvas");
                            freshCanvas.id = canvasElem.id;
                            freshCanvas.setAttribute('width', 512);
                            freshCanvas.setAttribute('height', 384);
                            canvasElem.replaceWith(freshCanvas);
                            
                            drawCanvas(freshCanvas, population.chroms[draggedChromId]);
                            setupCanvasCamera(freshCanvas, population.chroms[draggedChromId]);
                            attachDrop2(freshCanvas, isLeftNode);

                            // グリッドの選択状態を更新（もし表示されていれば）
                            if (window[`updateGridSelection_${population.index}`]) {
                                window[`updateGridSelection_${population.index}`]();
                            }
                        }
                    });
                }
                attachDrop2(newCanvas, i === 0);

                document.getElementById(`compareImages_${population.index}`).appendChild(newCanvas);
                setupCanvasCamera(newCanvas, population.chroms[chromId]);
            });

            enableEvaluateBtn(population, kuromojiTokenizer);
            elemMsgEvaluate.style.display = 'none';

            setTimeout(() => {
                let elemMain = document.querySelector('main');
                elemMain.scrollTo(0, elemMain.scrollHeight);
            }, 200);

        }, 50);
    });

    // ==========================================
    // 全個体を表示するボタンとエリアの動的生成
    // ==========================================
    let elemCompareImages = document.getElementById(`compareImages_${population.index}`);
    
    if (elemCompareImages && !document.getElementById(`btn-showall_${population.index}`)) {
        let btnShowAll = document.createElement('button');
        btnShowAll.id = `btn-showall_${population.index}`;
        btnShowAll.textContent = "全20個体を表示 🔽";
        btnShowAll.classList.add('btn-showall');
        btnShowAll.style.cssText = "display: block; margin: 10px auto; padding: 5px 15px; cursor: pointer; background-color: #f0f0f0; border: 1px solid #ccc; border-radius: 4px;";

        let showallArea = document.createElement('div');
        showallArea.id = `showall-area_${population.index}`;
        showallArea.style.display = 'none';

        // グリッドのコンテナ設定
        let showallGrid = document.createElement('div');
        showallGrid.style.display = 'flex';
        showallGrid.style.flexWrap = 'wrap';
        showallGrid.style.justifyContent = 'center';
        showallGrid.style.gap = '10px';
        showallGrid.style.marginTop = '15px';
        showallArea.appendChild(showallGrid);

        const canvasWrappers = [];

        // 外部から（ドロップ時に）見た目を更新できるように関数をウィンドウに登録
        window[`updateGridSelection_${population.index}`] = function() {
            canvasWrappers.forEach(w => {
                const idx = Number(w.dataset.index);
                w.style.border = "2px solid transparent";
                w.style.backgroundColor = "transparent";
                if (idx === population.bestChromId) {
                    w.style.border = "2px solid #ff8c00";
                    w.style.backgroundColor = "#fff3e0";
                } else if (idx === population.pickupChromId) {
                    w.style.border = "2px solid #008cff";
                    w.style.backgroundColor = "#e3f2fd";
                }
            });
        };

        // グリッドに20個体を追加
        for(let i = 0; i < population.chroms.length; i++) {
            const wrapper = document.createElement('div');
            wrapper.dataset.index = i;
            // ★固定幅を指定してレイアウトが潰れるのを完全に防ぐ
            wrapper.style.width = '140px'; 
            wrapper.style.padding = '8px';
            wrapper.style.borderRadius = '8px';
            wrapper.style.textAlign = 'center';
            wrapper.style.transition = 'all 0.2s';
            wrapper.style.border = "2px solid transparent";
            wrapper.style.boxSizing = "border-box";
            
            // ドラッグ元（つかめるアイテム）としての設定
            wrapper.draggable = true;
            wrapper.style.cursor = "grab";
            wrapper.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', i.toString());
                e.dataTransfer.effectAllowed = "copy";
            });

            const newCanvas = document.createElement("canvas");
            newCanvas.id = `cv_all_${population.index}_${i}`;
            // ★内部解像度は描画が崩れないよう本来の512x384に戻す
            newCanvas.setAttribute('width', 512); 
            newCanvas.setAttribute('height', 384);
            // ★CSSで表示サイズをラッパーの幅（100%）に縮小する
            newCanvas.style.width = "100%"; 
            newCanvas.style.height = "auto";
            newCanvas.style.borderRadius = "4px";
            newCanvas.style.pointerEvents = "none"; // ドラッグ時の誤作動防止
            
            drawCanvas(newCanvas, population.chroms[i]);
            setupCanvasCamera(newCanvas, population.chroms[i]); // スケール調整を適用
            
            const label = document.createElement('div');
            label.textContent = `#${i}`;
            label.style.fontSize = '14px';
            label.style.fontWeight = 'bold';
            label.style.marginTop = '6px';

            wrapper.appendChild(newCanvas);
            wrapper.appendChild(label);
            showallGrid.appendChild(wrapper);
            canvasWrappers.push(wrapper);
        }

        window[`updateGridSelection_${population.index}`]();

        btnShowAll.addEventListener('click', () => {
            const isHidden = showallArea.style.display === 'none';
            showallArea.style.display = isHidden ? 'block' : 'none';
            btnShowAll.textContent = isHidden ? "全個体を隠す 🔼" : "全20個体を表示 🔽";
        });

        elemCompareImages.after(btnShowAll);
        btnShowAll.after(showallArea);
    }
}

const patternNumMap = {
    'none':0, 'dot':1, 'stripe':2, 'checker':3, 'gingham':4, 'tartan':5, 
    'buffalo':6, 'houndstooth':7, 'windowpane':8, 'argyle':9, 'madras':10, 'cloud':11, 'neon':12
};

function fixChromString(value) {
    if (patternNumMap[value] !== undefined) return patternNumMap[value];
    if (value === 'circle') return 0;
    if (value === 'ellipse') return 0.5;
    if ((value === 'linear') || (value === 'radial') || (value === 'square')) return 2;
    if ((value === 'triangle') || (value === 'conic')) return 3;
    return Number(value) || 0; // NaNは強制的に0へクランプ
}

// ==========================================
// 評価実験用のデータ回収プログラム（Netlify自動送信）
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    const validateBtn = document.getElementById('validate');
    if (validateBtn) {
        validateBtn.addEventListener('click', function(e) {
            e.preventDefault(); // デフォルトの送信（画面遷移）をストップ
            
            // ① 送信ボタンを連打できないように「送信中...」にする
            const originalText = validateBtn.textContent;
            validateBtn.textContent = "送信中...";
            validateBtn.disabled = true;

            const form = document.getElementById('estimationForm');
            
            // ② 貯めていた操作ログを、HTMLの見えない入力欄にセットする
            const logInput = document.getElementById('system_log');
            if (logInput) {
                if (window.experimentLogs && window.experimentLogs.length > 0) {
                    logInput.value = window.experimentLogs.join('\n');
                } else {
                    logInput.value = "※ログなし";
                }
            }

            // ③ フォームのデータを全て取得
            const formData = new FormData(form);

            // ④ Netlifyに向けて裏で送信（fetch）
            fetch('/', {
                method: 'POST',
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams(formData).toString()
            })
            .then(() => {
                alert("送信が完了しました！ご協力ありがとうございました。");
                validateBtn.textContent = "送信完了";
            })
            .catch((error) => {
                alert("送信に失敗しました。時間をおいて再度お試しください。");
                validateBtn.textContent = originalText;
                validateBtn.disabled = false;
            });
        });
    }
});