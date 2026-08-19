window.addEventListener('DOMContentLoaded', () => {
  let cacheUpdated = true;

  const presets = {
    default: {
      bezelColor: '#222',
      dialColor: '#fff',
      dialIndexesColor: '#444',
      handColor: '#222',
      shadowColor: '#000000a0',
    },
    dark: {
      bezelColor: '#0b0d13',
      dialColor: '#0b0d13',
      dialIndexesColor: '#ffffff',
      handColor: '#ffffff',
      shadowColor: '#000000a0',
    },
    pink: {
      bezelColor: '#e7c7c7',
      dialColor: '#e7c7c7',
      dialIndexesColor: '#ae7070',
      handColor: '#ae7070',
      shadowColor: '#8A5959',
    }
  };

  const config = {
    beatRate: 8,
    ...presets.default,
    get beatPeriodMs() { return 1000 / this.beatRate; },
    get toMovePeriodMs() { return this.beatPeriodMs / 0.6; }
  };

  console.log("START");

  const canvas = document.body.querySelector('canvas#watch');
  if (canvas == null || !(canvas instanceof HTMLCanvasElement)) return;

  const ctx = canvas.getContext('2d');
  if (ctx == null) return;

  const height = canvas.height;
  const width = canvas.width;
  const centerX = width / 2;
  const centerY = height / 2;

  const size = Math.min(height, width);

  const cacheCanvas = document.createElement('canvas');
  cacheCanvas.width = width;
  cacheCanvas.height = height;
  const cacheCtx = cacheCanvas.getContext('2d');

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  const createWithinContext = (ctx) =>
    /** @param {(ctx: CanvasRenderingContext2D) => void} f */
    (f) => {
      ctx.save();
      try {
        f(ctx);
      } finally {
        ctx.restore();
      }
    };

  const withinContext = createWithinContext(ctx);
  const withinCacheContext = createWithinContext(cacheCtx);

  const drawCached = () => {
    if (cacheUpdated) {
      cacheUpdated = false;
      cacheCtx.clearRect(0, 0, width, height);

      // Bezel
      withinCacheContext((ctx) => {
        const radius = size / 2 * 0.9;
        ctx.fillStyle = config.bezelColor;
        ctx.shadowColor = config.shadowColor;
        ctx.shadowBlur = radius * 0.02;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = size * 0.002;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fill();
      });

      // Dial
      withinCacheContext((ctx) => {
        const radius = size / 2 * 0.8;
        ctx.fillStyle = config.dialColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
      });

      withinCacheContext((ctx) => {
        const ScaleCount = 60;

        const StartScaleBold = 0.675;
        const StartScaleThin = 0.755;
        const EndScale = 0.775;
        const LineScaleBold = 0.01;
        const LineScaleThin = 0.0025;

        ctx.strokeStyle = config.dialIndexesColor;

        for (let i = 0; i < ScaleCount; i++) {
          const radiusStart = size / 2 * (i % 5 === 0 ? StartScaleBold : StartScaleThin);
          const radiusEnd = size / 2 * EndScale;

          const x = Math.sin(2 * Math.PI * i / ScaleCount);
          const y = Math.cos(2 * Math.PI * i / ScaleCount - Math.PI);
          const startX = centerX + x * radiusStart;
          const startY = centerY + y * radiusStart;
          const endX = centerX + x * radiusEnd;
          const endY = centerY + y * radiusEnd;

          if (i % 5 === 0) {
            ctx.lineWidth = size * LineScaleBold;
          } else {
            ctx.lineWidth = size * LineScaleThin;
          }
          ctx.shadowColor = config.shadowColor;
          ctx.shadowBlur = size * 0.003;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = size * 0.001;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      });
    };

    ctx.drawImage(cacheCanvas, 0, 0);
  };

  const drawHand = (angle, radiusFactor, sizeFactor) => withinContext((ctx) => {
    const radius = size / 2 * radiusFactor;
    const x = Math.sin(angle);
    const y = Math.cos(angle);
    const endX = centerX + x * radius;
    const endY = centerY + y * radius;

    ctx.strokeStyle = config.handColor;
    ctx.lineWidth = size * sizeFactor;
    ctx.shadowColor = config.shadowColor;
    ctx.shadowBlur = size * 0.005;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = size * 0.004;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.fill();
  });

  const drawSecondHandCircle = () => withinContext((ctx) =>{
    const radius = size * 0.01;

    ctx.fillStyle = config.handColor;
    ctx.shadowColor = config.shadowColor;
    ctx.shadowBlur = size * 0.001;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = size * 0.002;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fill();
  });

  let lastSecond = -1;
  const frame = () => {
    const now = new Date();

    const ms = now.getMilliseconds();
    const msBase = Math.floor(ms / config.beatPeriodMs) * config.beatPeriodMs;
    const msEase = (ms % config.beatPeriodMs) > config.toMovePeriodMs ? (ms % config.beatPeriodMs) : 0;
    const second = now.getSeconds() + (msBase + msEase) / 1000;
    if (lastSecond === second) {
      requestAnimationFrame(frame);
      return;
    }

    const secondRad = Math.PI - 2 * Math.PI * second / 60;
    const minuteRad = Math.PI - 2 * Math.PI * (now.getMinutes() + second / 60) / 60;
    const hourRad = Math.PI - 2 * Math.PI * (now.getHours() + now.getMinutes() / 60 + second / 3600) / 12;

    ctx.clearRect(0, 0, width, height);

    drawCached();
    drawHand(hourRad, 0.55, 0.03);
    drawHand(minuteRad, 0.775, 0.02);
    drawHand(secondRad, 0.7, 0.005);
    drawHand(Math.PI + secondRad, 0.2, 0.01);
    drawSecondHandCircle();

    lastSecond = second;
    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);

  console.log("DONE");

  let updateGainPattern;
  let stopTickSound;
  const startTickSound = () => {
    console.log('Start tick sound');

    const audioCtx = new AudioContext();

    const noiseMixingMap = {
      1: 0.75,
      5: 0.6,
      6: 0.5,
      7: 0.5,
      8: 0.5,
      10: 0.4,
      default: 0.5,
    };

    const frequencyMap = {
      1: 7100,
      5: 7050,
      6: 7100,
      7: 7400,
      8: 8800,
      10: 9500,
      default: 8000,
    };

    const createNoiseBuffer = () => {
      const buffer = audioCtx.createBuffer(
        1,
        2 * audioCtx.sampleRate,
        audioCtx.sampleRate,
      );
      const channel = buffer.getChannelData(0);
      for (let i = 0; i < channel.length; i++) {
        channel[i] = Math.random() * 2 - 1;
      }
      return buffer;
    };

    const createGainPattern = () => {
      const buffer = audioCtx.createBuffer(
        1,
        2 * audioCtx.sampleRate,
        audioCtx.sampleRate,
      );

      const tickInterval = Math.floor(audioCtx.sampleRate / config.beatRate);
      const tickPeriod = Math.floor(audioCtx.sampleRate * 0.0125);

      const channel = buffer.getChannelData(0);
      let volFactor = 0;
      for (let i = 0; i < channel.length; i++) {
        const t = i % tickInterval;
        if (t > 0 && t < tickPeriod) {
          if (volFactor === 0) volFactor = 0.8 + Math.random() / 5;
          channel[i] = -1 + 0.05 * (tickPeriod - t) / tickPeriod * volFactor;
        } else {
          channel[i] = -1;
          volFactor = 0;
        }
      }

      return buffer;
    };

    const noiseVolume = noiseMixingMap[config.beatRate] ?? noiseMixingMap.default;
    const oscVolume = 1 - noiseVolume;

    const noise = audioCtx.createBufferSource();
    noise.buffer = createNoiseBuffer();
    noise.loop = true;

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(noiseVolume, audioCtx.currentTime);
    noise.connect(noiseGain);

    const osc = audioCtx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(
      frequencyMap[config.beatRate] ?? frequencyMap.default,
      audioCtx.currentTime,
    );

    const oscGain = audioCtx.createGain();
    oscGain.gain.setValueAtTime(oscVolume, audioCtx.currentTime);
    osc.connect(oscGain);

    const gainNode = audioCtx.createGain();
    noiseGain.connect(gainNode);
    oscGain.connect(gainNode);

    const gainPatternSource = audioCtx.createBufferSource();
    gainPatternSource.buffer = createGainPattern();
    gainPatternSource.loop = true;
    gainPatternSource.connect(gainNode.gain);

    const filterNode = audioCtx.createBiquadFilter();
    filterNode.type = 'highpass';
    filterNode.frequency.setValueAtTime(3600, 0);
    filterNode.Q.setValueAtTime(0.9, 0);
    gainNode.connect(filterNode);
    filterNode.connect(audioCtx.destination);

    const nextSecond = audioCtx.currentTime + 1 - (Date.now() % 1000) / 1000;
    gainPatternSource.start(nextSecond);
    osc.start(nextSecond);
    noise.start(nextSecond);

    stopTickSound = () => {
      console.log('Stop tick sound');
      stopTickSound = null;
      updateGainPattern = null;

      noise.stop();
      noise.disconnect();
      osc.stop();
      osc.disconnect();
      gainPatternSource.stop();
      gainPatternSource.disconnect();
    };
  };

  const restartTickSound = () => {
    if (stopTickSound) {
      stopTickSound();
      startTickSound();
    }
  };

  const toggleTickSound = () => {
    if (stopTickSound) {
      stopTickSound();
    } else {
      startTickSound()
    }
  };

  const beatRateInput = document.querySelector('#beat-rate');
  beatRateInput.value = config.beatRate;
  beatRateInput.addEventListener('change', (ev) => {
    const value = ev.currentTarget.value;
    if (value && /^[0-9]+$/.test(value)) {
      console.log('beat updated');
      config.beatRate = parseInt(value, 10);
      restartTickSound();
    }
  });

  const checkColorCode = (code) =>
    code && /^(#[0-9a-f]{3}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(code);

  const registerColorInputHandler = (elem, propertyName) => {
    elem.value = config[propertyName];
    elem.addEventListener('change', (ev) => {
      const value = ev.currentTarget.value;
      if (checkColorCode(value)) {
        config[propertyName] = value;
        cacheUpdated = true;
      } else {
        console.log(value);
      }
    });
  };

  const inputs = {
    bezelColor: document.querySelector('#bezel-color'),
    dialColor: document.querySelector('#dial-color'),
    dialIndexesColor: document.querySelector('#dial-indexes-color'),
    handColor: document.querySelector('#hand-color'),
    shadowColor: document.querySelector('#shadow-color'),
  };

  Object.entries(inputs).forEach(([fieldName, elem]) => {
    registerColorInputHandler(elem, fieldName);
  });

  const presetInput = document.querySelector('#preset');
  Object.keys(presets).forEach((presetName) => {
    const option = document.createElement('option');
    option.value = presetName;
    option.textContent = presetName;
    presetInput.appendChild(option);
  });
  presetInput.addEventListener('change', (ev) => {
    const presetName = ev.currentTarget.value;
    if (Object.keys(presets).includes(presetName)) {
      Object.assign(config, presets[presetName]);
      Object.entries(presets[presetName]).forEach(([fieldName, value]) => {
        if (inputs[fieldName]) inputs[fieldName].value = value;
      });
      cacheUpdated = true;
    }
  });

  document.querySelector('#play-tick').addEventListener('click', () => {
    toggleTickSound();
  });
});
