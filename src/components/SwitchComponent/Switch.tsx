import { useState } from 'react';
import styled from 'styled-components';

interface SwitchProps {
	onCheckedChange?: (checked: boolean) => void;
}

const SwitchComponent = ({ onCheckedChange }: SwitchProps) => {
	const [checked, setChecked] = useState(false);
	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const isChecked = event.target.checked;
		setChecked(isChecked);
		if (onCheckedChange) {
			onCheckedChange(isChecked);
		}
	};
	return (
		<StyledWrapper>
			<label className='switch' htmlFor='theme-switch'>
				<input
					checked={checked}
					onChange={handleChange}
					id='theme-switch'
					type='checkbox'
					aria-label='Toggle theme'
					title='Toggle between light and dark theme'
				/>
				<span className='slider' />
			</label>
		</StyledWrapper>
	);
};

const StyledWrapper = styled.div`
  /* The switch - the box around the slider */
  .switch {
    font-size: 12px; /* Увеличиваем размер */
    position: relative;
    display: inline-block;
    width: 5em; /* Увеличиваем ширину */
    height: 2.5em; /* Увеличиваем высоту */
  }

  /* Hide default HTML checkbox */
  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
    box-shadow:
      0 0 30px rgba(255, 255, 255, 0.6),
      0 0 60px rgba(255, 255, 255, 0.3);
  }

  /* The slider */
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      #1a003f,
      #08001a
    ); /* Более глубокий космический фон */
    transition: all 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55); /* Плавный переход с кастомной кривой */
    border-radius: 50px; /* Скругляем углы */
    overflow: hidden;
    box-shadow:
      inset 0 0 15px rgba(255, 255, 255, 0.2),
      inset 0 0 30px rgba(255, 255, 255, 0.1),
      0 0 20px rgba(255, 255, 255, 0.1);
  }

  /* Звезды на фоне */
  .slider::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background:
      radial-gradient(circle, rgba(255, 255, 255, 0.7) 1px, transparent 1px) 0 0,
      radial-gradient(circle, rgba(255, 255, 255, 0.4) 1px, transparent 1px) 10px
        10px,
      radial-gradient(circle, rgba(255, 255, 255, 0.2) 1px, transparent 1px) 20px
        20px;
    background-size:
      30px 30px,
      40px 40px,
      50px 50px; /* Разные размеры для случайности */
    animation:
      stars-move 20s linear infinite,
      stars-twinkle 4s ease-in-out infinite;
      
  }

  /* Анимация движения звезд */
  @keyframes stars-move {
    from {
      transform: translateX(0) translateY(0);
    }
    to {
      transform: translateX(-15px) translateY(-10px);
    }
  }

  /* Анимация мерцания звезд */
  @keyframes stars-twinkle {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.2;
    }
  }

  /* Круглый переключатель */
  .slider:after {
    position: absolute;
    content: "";
    height: 2em; /* Увеличиваем размер круга */
    width: 2em; /* Увеличиваем размер круга */
    border-radius: 50%;
    background: radial-gradient(circle, #d3d3d3, #a9a9a9); /* Цвет "луны" */
    top: 0.25em;
    left: 0.25em;
    transition: all 1s cubic-bezier(0.68, -0.55, 0.27, 1.55); /* Плавный переход с кастомной кривой */
    box-shadow:
      0 0 15px rgba(255, 255, 255, 0.6),
      0 0 30px rgba(255, 255, 255, 0.3);
  }

  /* Кратеры на луне */
  .slider:after::before {
    content: "";
    position: absolute;
    width: 0.4em; /* Средний кратер */
    height: 0.4em;
    background: rgba(136, 136, 136, 0.8);
    border-radius: 50%;
    top: 0.5em;
    left: 0.8em;
    box-shadow:
      0.6em 0.3em 0 0 rgba(136, 136, 136, 0.8),
      /* Маленький кратер */ -0.3em -0.4em 0 0 rgba(136, 136, 136, 0.8); /* Маленький кратер */
  }

  /* Состояние переключателя включен */
  .switch input:checked + .slider:after {
    background: radial-gradient(circle, #d3d3d3, #a9a9a9);/* Оранжевый градиент */
    transform: translateX(2.5em); /* Увеличиваем смещение */
     box-shadow:
      0.6em 0.3em 0 0 rgba(136, 136, 136, 0.8),
  }

  /* Эффект фокуса */
  .switch input:focus + .slider {
    outline: none;
    
  }

  /* Реалистичный эффект свечения при наведении */
  .slider:hover {
    box-shadow:
      inset 0 0 20px rgba(255, 255, 255, 0.3),
      inset 0 0 40px rgba(255, 255, 255, 0.15),
      0 0 25px rgba(255, 255, 255, 0.2);
    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55); /* Плавный переход */
  }`;

export default SwitchComponent;
