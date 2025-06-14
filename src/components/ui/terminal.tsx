import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

interface TerminalProps {
	children?: React.ReactNode;
}

export const Terminal = ({ children }: TerminalProps) => {
	const [isMinimized, setIsMinimized] = useState(false);
	const contentRef = useRef<HTMLDivElement>(null);

	const toggleMinimize = () => {
		setIsMinimized(!isMinimized);
	};

	useEffect(() => {
		if (contentRef.current && !isMinimized) {
			contentRef.current.scrollTop = contentRef.current.scrollHeight;
		}
	}, [children, isMinimized]);

	return (
		<StyledWrapper $isMinimized={isMinimized}>
			<div className='status-container'>
				<div className='status'>
					<div className='mac-header'>
						<span
							className='red'
							onClick={toggleMinimize}
							role='button'
							tabIndex={0}
							title={isMinimized ? 'Maximizar terminal' : 'Minimizar terminal'}
							aria-label={isMinimized ? 'Maximizar terminal' : 'Minimizar terminal'}
						/>
						Consola
					</div>{' '}
					<div className='mac-content' ref={contentRef}>
						{React.Children.map(children, (child) => (
							<div className='terminal-line'>
								<span>~</span>
								<span className='arrow'>❯</span>
								<span>{child}</span>
							</div>
						))}{' '}
						<div className='terminal-line'>
							<span>~</span>
							<span className='arrow'>❯</span>
							<span className='cursor' />
						</div>
					</div>
				</div>
			</div>
		</StyledWrapper>
	);
};

const StyledWrapper = styled.div<{ $isMinimized: boolean }>`
  .status-container {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 20px;
  }

  .status {
    display: flex;
    flex-direction: column;
    background-color: #222533;
    color: #fbebe2;
    padding: 10px;
    width: 100%;
    height: ${(props) => (props.$isMinimized ? '40px' : '300px')};
    border-radius: 10px;
    user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    transition: all 0.3s ease-in-out;
    border: transparent 1px solid;
    overflow: hidden;
  }
  .mac-content {
    display: flex;
    flex-direction: column;
    cursor: text;
    gap: 8px;
    overflow-y: auto;
    height: ${(props) => (props.$isMinimized ? '0' : 'calc(100% - 40px)')};
    transition: all 0.3s ease-in-out;
  }

  .terminal-line {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
  }

  .status span {
    font-size: 1rem;
    font-weight: 400;
    transition: all 0.3s ease-in-out;
  }
  .status span:first-child {
    color: #57c7ff;
  }
  .status .arrow {
    color: #ff6ac1;
  }
  .text-white {
    color: #ffffff !important;
  }
  .cursor {
    display: inline-block;
    width: 2px;
    height: 16px;
    background-color: #ffffff;
    margin-left: 4px;
    animation: blink 1s step-end infinite;
  }

  @keyframes blink {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
  }

  .mac-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: ${(props) => (props.$isMinimized ? '0' : '15px')};
    transition: all 0.3s ease-in-out;
  }

  .mac-header span {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    cursor: pointer;
  }

  .mac-header .red {
    background-color: #ff5f57;
    &:hover {
      opacity: 0.8;
    }
  }

  .mac-header .yellow {
    background-color: #ffbd2e;
  }

  .mac-header .green {
    background-color: #28c941;
  }

  @media (max-width: 768px) {
    .status-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
    }
  }
`;
