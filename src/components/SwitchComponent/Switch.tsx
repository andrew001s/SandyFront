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
		onCheckedChange?.(isChecked);
	};

	return (
		<StyledWrapper>
			<label className='switch' htmlFor='theme-switch'>
				<input
					checked={checked}
					onChange={handleChange}
					id='theme-switch'
					type='checkbox'
					aria-label='Toggle speech recognition'
					title='Alternar reconocimiento de voz'
				/>
				<span className='slider'>
					<span className='state'>{checked ? 'ON' : 'OFF'}</span>
				</span>
			</label>
		</StyledWrapper>
	);
};

const StyledWrapper = styled.div`
  .switch {
    position: relative;
    display: inline-block;
    width: 4.75rem;
    height: 2.5rem;
  }

  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    inset: 0;
    cursor: pointer;
    border-radius: 9999px;
    border: 1px solid var(--border);
    background: var(--muted);
    transition: background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04);
  }

  .slider::after {
    content: "";
    position: absolute;
    top: 0.19rem;
    left: 0.19rem;
    width: 2.06rem;
    height: 2.06rem;
    border-radius: 9999px;
    background: var(--background);
    border: 1px solid var(--border);
    transition: transform 180ms ease, background-color 180ms ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.14);
  }

  .state {
    position: absolute;
    top: 50%;
    right: 0.55rem;
    transform: translateY(-50%);
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--muted-foreground);
    user-select: none;
  }

  .switch input:checked + .slider {
    background: color-mix(in oklab, var(--primary) 18%, var(--muted));
    border-color: color-mix(in oklab, var(--primary) 30%, var(--border));
  }

  .switch input:checked + .slider::after {
    transform: translateX(2.25rem);
    background: var(--primary-foreground);
  }

  .switch input:checked + .slider .state {
    left: 0.55rem;
    right: auto;
    color: var(--primary);
  }

  .switch input:focus-visible + .slider {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
`;

export default SwitchComponent;
