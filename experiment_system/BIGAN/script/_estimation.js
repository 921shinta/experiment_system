// #MARK: 評価実験


const elemValidateBtn = document.getElementById('validate');


export function enableEstimation() {
	// #MARK: 要素追加
	let elemEstimationSwitchLabel = document.createElement("label");
	elemEstimationSwitchLabel.setAttribute('for', 'form_exp');
	elemEstimationSwitchLabel.innerText = '評価実験';
	document.getElementsByClassName('header-control')[0].appendChild(elemEstimationSwitchLabel);
	const elemEstimation = document.getElementById('estimation');
	elemEstimation.removeAttribute('hidden');

	// #MARK: フォーム
	let elemStudentNumRange = document.getElementById('student_num_range');
	let elemStudentNumField = document.getElementById('student_num');
	elemStudentNumRange.addEventListener('input', () => {
		elemStudentNumField.value = elemStudentNumRange.value;
	});
	elemStudentNumField.addEventListener('change', () => {
		elemStudentNumRange.value = elemStudentNumField.value;
	});

	elemValidateBtn.addEventListener('click', validate);
}

function validate() {
	// #MARK: 値の検証
	const elemAnswers = document.querySelectorAll('#estimation form dd:has(input, textarea)');

	// check.phpから戻ってきたときに無駄に要素を増やさない
	if (document.getElementById('tmp_canv') != null) {
		document.getElementById('tmp_canv').remove();
	}
	if(document.getElementById('tmp_eval') != null) {
		document.getElementById('tmp_eval').remove();
	}

	let hasError = false;
	// elemAnswerWrapper: <dd>
	elemAnswers.forEach(elemAnswerWrapper => {
		elemAnswerWrapper.classList.remove('error');

		const elemQuestion = elemAnswerWrapper.previousElementSibling;
		const isRequired = elemQuestion.classList.contains('required');
		const elemAnswer = elemAnswerWrapper.querySelector('input[type="radio"]:checked, input[type="text"], input[type="number"], textarea');
		console.log(elemAnswer);
		if (isRequired && (elemAnswer == null)) {
			console.warn('必須項目なのに内容が選択されていません');
			hasError = true;
			elemAnswerWrapper.classList.add('error');
		} else if (isRequired && (elemAnswer.value == false)) {
			console.warn('必須項目なのに内容がありません');
			hasError = true;
			elemAnswerWrapper.classList.add('error');
		}
	});

	// #MARK: 検証後
	if (!hasError) {
		// フォームにやり取りを追加する
		const elemsUserEvaluate = document.querySelectorAll('.genCycle textarea');
		const elemsCanvas = document.querySelectorAll('.genCycle canvas');
		const elemForm = document.getElementById('estimationForm');

		let canvasDataArray = [];
		elemsCanvas.forEach(canvas => {
			const dataURL = canvas.toDataURL();
			canvasDataArray.push(dataURL);
		});
		let elemCanvasData = document.createElement('textarea');
		elemCanvasData.id = 'tmp_canv';
		elemCanvasData.hidden = true;
		elemCanvasData.name = 'canvasData';
		elemCanvasData.value = JSON.stringify(canvasDataArray);
		elemForm.appendChild(elemCanvasData);

		let evaluationTextArray = [];
		elemsUserEvaluate.forEach(textarea => {
			evaluationTextArray.push(textarea.value);
		});
		let elemEvaluate = document.createElement('textarea');
		elemEvaluate.id = 'tmp_eval';
		elemEvaluate.hidden = true;
		elemEvaluate.name = 'evaluationText';
		elemEvaluate.value = JSON.stringify(evaluationTextArray);
		elemForm.appendChild(elemEvaluate);

		// フォームをsubmit
		elemForm.submit();
		document.getElementById('tmp_canv').remove();
		document.getElementById('tmp_eval').remove();

	} else {
		elemValidateBtn.classList.add('error');
	}
}