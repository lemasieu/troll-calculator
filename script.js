document.addEventListener('DOMContentLoaded', function() {
    const digitSets = {
        decimal: ['0','1','2','3','4','5','6','7','8','9','.'],
        binary: ['0','1'],
        octal: ['0','1','2','3','4','5','6','7'],
        hexadecimal: ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F'],
        roman: ['I','V','X','L','C','D','M'],
        persian: ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'],
        chinese: ['〇','一','二','三','四','五','六','七','八','九']
    };

    const typeNames = {
        decimal: 'Thập phân',
        binary: 'Nhị phân',
        octal: 'Bát phân',
        hexadecimal: 'Thập lục phân',
        roman: 'La Mã',
        persian: 'Ba Tư',
        chinese: 'Trung Quốc'
    };

    const digitMaps = {
        persian: '۰۱۲۳۴۵۶۷۸۹',
        chinese: '〇一二三四五六七八九'
    };

    const inputTypeSelect = document.getElementById('inputType');
    const keypad = document.getElementById('keypad');
    const expressionDiv = document.getElementById('expression');
    const resultDisplay = document.getElementById('resultDisplay');
    const trollNote = document.getElementById('trollNote');
    const powerBtn = document.getElementById('powerBtn');

    let currentInput = '';
    let previousValue = null;
    let operator = null;
    let shouldReset = false;
    let isPoweredOn = false;

    function togglePower() {
        isPoweredOn = !isPoweredOn;
        const calc = document.querySelector('.calculator');
        const screen = document.querySelector('.screen');
        if (isPoweredOn) {
            powerBtn.classList.remove('off');
            powerBtn.classList.add('on');
            calc.classList.remove('powered-off');
            screen.classList.remove('powered-off');
            // Reset nhưng để sẵn số 0 để nhận phép toán ngay
            handleClear();
            currentInput = '0';
            updateDisplay();
            // Xóa biểu thức và troll note
            expressionDiv.textContent = '';
            trollNote.textContent = '';
        } else {
            powerBtn.classList.remove('on');
            powerBtn.classList.add('off');
            calc.classList.add('powered-off');
            screen.classList.add('powered-off');
            resultDisplay.textContent = '';
            expressionDiv.textContent = '';
            trollNote.textContent = '';
            currentInput = '';
            previousValue = null;
            operator = null;
            shouldReset = false;
        }
    }

    function renderKeypad(type) {
        const digits = digitSets[type] || digitSets.decimal;
        keypad.innerHTML = '';
        digits.forEach(d => {
            const btn = document.createElement('button');
            btn.textContent = d;
            btn.classList.add('num-key');
            if (d === '.') btn.classList.add('dot');
            btn.dataset.value = d;
            btn.addEventListener('click', () => {
                if (!isPoweredOn) return;
                handleDigit(d);
            });
            keypad.appendChild(btn);
        });
    }

    function handleDigit(value) {
        if (!isPoweredOn) return;
        if (shouldReset) {
            currentInput = '';
            shouldReset = false;
        }
        if (value === '.') {
            if (currentInput.includes('.')) return;
            if (currentInput === '') currentInput = '0';
        }
        if (currentInput.length > 18) return;
        if (currentInput === '0' && value !== '.') {
            currentInput = value;
        } else {
            currentInput += value;
        }
        updateDisplay();
    }

    function parseNumber(str, type) {
        str = str.trim();
        if (str === '') return NaN;
        let result = NaN;
        if (type === 'decimal') {
            if (/^-?\d+(\.\d+)?$/.test(str)) result = parseFloat(str);
        } else if (type === 'binary') {
            if (/^-?[01]+$/.test(str)) result = parseInt(str, 2);
        } else if (type === 'octal') {
            if (/^-?[0-7]+$/.test(str)) result = parseInt(str, 8);
        } else if (type === 'hexadecimal') {
            if (/^-?[0-9A-Fa-f]+$/.test(str)) result = parseInt(str, 16);
        } else if (type === 'persian') {
            let mapped = str;
            for (let i = 0; i < 10; i++) mapped = mapped.replace(new RegExp(digitMaps.persian[i], 'g'), i);
            if (/^-?\d+(\.\d+)?$/.test(mapped)) result = parseFloat(mapped);
        } else if (type === 'chinese') {
            let mapped = str;
            for (let i = 0; i < 10; i++) mapped = mapped.replace(new RegExp(digitMaps.chinese[i], 'g'), i);
            if (/^-?\d+(\.\d+)?$/.test(mapped)) result = parseFloat(mapped);
        } else if (type === 'roman') {
            let clean = str.replace(/\s/g, '').toUpperCase();
            if (!/^[IVXLCDM]+$/.test(clean)) return NaN;
            const map = {I:1,V:5,X:10,L:50,C:100,D:500,M:1000};
            let total = 0, i = 0;
            while (i < clean.length) {
                let curr = map[clean[i]];
                let next = (i+1 < clean.length) ? map[clean[i+1]] : 0;
                if (curr < next) { total += next - curr; i+=2; }
                else { total += curr; i++; }
            }
            if (total < 1 || total > 3999) return NaN;
            result = total;
        }
        return result;
    }

    function formatNumber(num, type) {
        if (!isFinite(num)) return 'Vô cực';
        const isInteger = Number.isInteger(num);
        const isNegative = num < 0;
        if (type === 'decimal') return num.toString();
        if (type === 'binary') {
            if (!isInteger || isNegative) return 'Không hỗ trợ';
            return num.toString(2);
        }
        if (type === 'octal') {
            if (!isInteger || isNegative) return 'Không hỗ trợ';
            return num.toString(8);
        }
        if (type === 'hexadecimal') {
            if (!isInteger || isNegative) return 'Không hỗ trợ';
            return num.toString(16).toUpperCase();
        }
        if (type === 'roman') {
            if (!isInteger || isNegative || num === 0 || num > 3999) return 'Không hỗ trợ';
            return toRoman(num);
        }
        if (type === 'persian') {
            let str = num.toString();
            let res = '';
            for (let ch of str) {
                if (ch === '-') res += '-';
                else if (ch === '.') res += '.';
                else if (ch >= '0' && ch <= '9') res += digitMaps.persian[parseInt(ch)];
                else res += ch;
            }
            return res;
        }
        if (type === 'chinese') {
            let str = num.toString();
            let res = '';
            for (let ch of str) {
                if (ch === '-') res += '-';
                else if (ch === '.') res += '.';
                else if (ch >= '0' && ch <= '9') res += digitMaps.chinese[parseInt(ch)];
                else res += ch;
            }
            return res;
        }
        return num.toString();
    }

    function toRoman(num) {
        const roman = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
        let res = '';
        for (let [val, sym] of roman) {
            while (num >= val) { res += sym; num -= val; }
        }
        return res;
    }

    function updateDisplay() {
        if (!isPoweredOn) {
            resultDisplay.textContent = '';
            return;
        }
        resultDisplay.textContent = currentInput || '0';
        if (currentInput.length > 10) resultDisplay.classList.add('shrink');
        else resultDisplay.classList.remove('shrink');
    }

    function setOperator(op) {
        if (!isPoweredOn) return;
        if (operator && !shouldReset) {
            calculate();
            if (operator) return;
        }
        if (operator && shouldReset && currentInput === '') {
            operator = op;
            const currentType = inputTypeSelect.value;
            const displayPrev = formatNumber(previousValue, currentType);
            expressionDiv.textContent = `${displayPrev} ${opSymbol(op)}`;
            return;
        }
        const currentType = inputTypeSelect.value;
        const currentNum = parseNumber(currentInput, currentType);
        if (isNaN(currentNum)) {
            resultDisplay.textContent = 'Lỗi nhập';
            trollNote.textContent = '';
            expressionDiv.textContent = '';
            return;
        }
        previousValue = currentNum;
        operator = op;
        const displayPrev = formatNumber(previousValue, currentType);
        expressionDiv.textContent = `${displayPrev} ${opSymbol(op)}`;
        shouldReset = true;
        currentInput = '';
        updateDisplay();
    }

    function opSymbol(op) {
        switch(op) {
            case 'add': return '+';
            case 'subtract': return '−';
            case 'multiply': return '×';
            case 'divide': return '÷';
            default: return '';
        }
    }

    function calculate() {
        if (!isPoweredOn) return;
        const currentType = inputTypeSelect.value;

        if (!operator || previousValue === null) {
            const num = parseNumber(currentInput, currentType);
            if (isNaN(num)) {
                resultDisplay.textContent = 'Lỗi nhập';
                trollNote.textContent = '';
                expressionDiv.textContent = '';
                return;
            }
            resultDisplay.textContent = currentInput || '0';
            trollNote.textContent = '';
            expressionDiv.textContent = '';
            return;
        }

        const num1 = previousValue;
        const num2 = parseNumber(currentInput, currentType);
        if (isNaN(num2)) {
            resultDisplay.textContent = 'Lỗi nhập';
            trollNote.textContent = '';
            return;
        }

        let result;
        switch(operator) {
            case 'add': result = num1 + num2; break;
            case 'subtract': result = num1 - num2; break;
            case 'multiply': result = num1 * num2; break;
            case 'divide':
                if (num2 === 0) {
                    resultDisplay.textContent = 'Không chia được';
                    trollNote.textContent = '';
                    return;
                }
                result = num1 / num2; break;
            default: result = num2;
        }

        const allTypes = ['decimal','binary','octal','hexadecimal','roman','persian','chinese'];
        let filtered = allTypes.filter(t => t !== currentType);
        const isInteger = Number.isInteger(result);
        const isNegative = result < 0;
        if (!isInteger || isNegative) {
            filtered = filtered.filter(t => ['decimal','persian','chinese'].includes(t));
        } else {
            if (result === 0 || result > 3999) filtered = filtered.filter(t => t !== 'roman');
        }
        const inputRep = formatNumber(result, currentType);
        let best = filtered.filter(t => formatNumber(result, t) !== inputRep);
        let randomType;
        if (best.length > 0) randomType = best[Math.floor(Math.random() * best.length)];
        else {
            if (filtered.length === 0) filtered = ['decimal'];
            randomType = filtered[Math.floor(Math.random() * filtered.length)];
        }

        const outputStr = formatNumber(result, randomType);

        resultDisplay.textContent = outputStr;
        const displayPrev = formatNumber(num1, currentType);
        const displayCurr = formatNumber(num2, currentType);
        expressionDiv.textContent = `${displayPrev} ${opSymbol(operator)} ${displayCurr} =`;
        trollNote.textContent = `Random: Kết quả hiển thị dạng ${typeNames[randomType]} thay vì ${typeNames[currentType]}!`;

        if (outputStr !== 'Không hỗ trợ' && outputStr !== 'Vô cực') {
            inputTypeSelect.value = randomType;
            renderKeypad(randomType);
            currentInput = outputStr;
            previousValue = result;
            operator = null;
            shouldReset = true;
            updateDisplay();
        } else {
            currentInput = outputStr;
            previousValue = result;
            operator = null;
            shouldReset = true;
            updateDisplay();
        }
    }

    function handleClear() {
        if (!isPoweredOn) return;
        currentInput = '';
        previousValue = null;
        operator = null;
        shouldReset = false;
        expressionDiv.textContent = '';
        trollNote.textContent = '';
        resultDisplay.textContent = '0';
        resultDisplay.classList.remove('shrink');
    }

    function handleBackspace() {
        if (!isPoweredOn) return;
        if (shouldReset) return;
        currentInput = currentInput.slice(0, -1);
        if (currentInput === '') currentInput = '0';
        updateDisplay();
    }

    function handleNegate() {
        if (!isPoweredOn) return;
        if (shouldReset) return;
        if (!currentInput || currentInput === '0' || currentInput === '-') return;
        if (currentInput.startsWith('-')) {
            currentInput = currentInput.slice(1);
        } else {
            currentInput = '-' + currentInput;
        }
        updateDisplay();
    }

    powerBtn.addEventListener('click', togglePower);

    document.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.dataset.action;
            switch(action) {
                case 'clear': handleClear(); break;
                case 'backspace': handleBackspace(); break;
                case 'negate': handleNegate(); break;
                case 'add':
                case 'subtract':
                case 'multiply':
                case 'divide':
                    setOperator(action);
                    break;
                case 'calculate':
                    calculate();
                    break;
                default: break;
            }
        });
    });

    inputTypeSelect.addEventListener('change', function() {
        if (!isPoweredOn) return;
        const newType = this.value;
        renderKeypad(newType);
        handleClear();
        resultDisplay.textContent = '0';
        trollNote.textContent = '';
        expressionDiv.textContent = '';
    });

    // Khởi tạo: mặc định tắt
    renderKeypad(inputTypeSelect.value);
    const calc = document.querySelector('.calculator');
    const screen = document.querySelector('.screen');
    powerBtn.classList.add('off');
    calc.classList.add('powered-off');
    screen.classList.add('powered-off');
    resultDisplay.textContent = '';
    expressionDiv.textContent = '';
    trollNote.textContent = '';
});