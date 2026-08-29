import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LineInputs } from './LineInputs';

describe('LineInputs', () => {
  it('세 줄을 안내 문구와 함께 보여준다', () => {
    render(<LineInputs lines={['', '', '']} onChange={() => {}} />);
    expect(screen.getByPlaceholderText('오늘 있었던 일')).toBeDefined();
    expect(screen.getByPlaceholderText('느낀 점')).toBeDefined();
    expect(screen.getByPlaceholderText('내일의 다짐')).toBeDefined();
  });

  it('이미 쓴 내용을 그대로 보여준다', () => {
    render(<LineInputs lines={['하나', '둘', '셋']} onChange={() => {}} />);
    expect(screen.getByDisplayValue('하나')).toBeDefined();
    expect(screen.getByDisplayValue('셋')).toBeDefined();
  });

  it('가운데 줄만 바꿔서 알려준다', async () => {
    const onChange = vi.fn();
    render(<LineInputs lines={['하나', '', '셋']} onChange={onChange} />);
    await userEvent.type(screen.getByPlaceholderText('느낀 점'), '좋')
    expect(onChange).toHaveBeenCalledWith(['하나', '좋', '셋']);
  });

  it('한 줄은 60자까지만 받는다', () => {
    render(<LineInputs lines={['', '', '']} onChange={() => {}} />);
    const input = screen.getByPlaceholderText('오늘 있었던 일') as HTMLInputElement;
    expect(input.maxLength).toBe(60);
  });
});
