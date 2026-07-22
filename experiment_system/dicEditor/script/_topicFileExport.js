import { pageData, topicData } from "./topic.js";

const topicFileHeadtext = `c,先頭列はフラグ,cはコメント,iはキーに使う,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,印象値との関連,,,,,,,
c,主語,左,右,背景 色相,彩度,明度,グラデ 種類,中心,グラデ 波長,位相,波形,図形 種類,位置x,位置y,回転,大きさ,色相,彩度,明度,不透明度,縁取り 色相,彩度,明度,不透明度,縁の幅,繰り返し 方向,回数,回転変化,サイズ変化,色相変化,彩度変化,明度変化,明瞭,綺麗,整列,密,明,暖かい,鋭い,滑らか
i,subject,IL,IR,GBH,GBS,GBL,GGT,GGC,GWL,GWA,GWS,GFT,GCX,GCY,GFR,GFZ,GFH,GFS,GFL,GFA,GSH,GSS,GSL,GSA,GSW,GRD,GRC,GRR,GRZ,GRH,GRS,GRL,ICA,ICE,IAL,IAB,IBT,IWM,ISH,ISM`;

export function enableTopicExportButton() {
	const elemExportFile = document.getElementById('exportFile');
	elemExportFile.removeAttribute('hidden');
	elemExportFile.addEventListener('click', () => {
		let csvText = topicFileHeadtext;
		topicData.forEach(topic => {
			let line = `\n,${topic.name}`;
			pageData._keys.forEach(key => {
				line += `,${topic.keys[key] ? 1 : 0}`;
			});
			csvText += line;
		});
		const blob = new Blob([csvText], {type: "text/plain"});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'keysFromTopic.csv';
		a.click();
		URL.revokeObjectURL(url);
		pageData.unsavedTime = 0;
		pageData.isEdited = false;
		document.querySelector('.unsavedTime span').innerText = `00:00`;
	});	
}
