import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DiaryTextArea } from './DiaryTextArea';

describe('DiaryTextArea', () => {
  it('안내 문구를 보여준다', () => {
    render(<DiaryTextArea text="" onChange={() => {}} />);
    expect(
      screen.getByPlaceholderText('오늘 있었던 일, 느낀 점, 다짐을 자유롭게 적어보세요')
    ).toBeDefined();
  });

  it('이미 쓴 내용을 그대로 보여준다', () => {
    render(<DiaryTextArea text={'하나\n둘\n셋'} onChange={() => {}} />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('하나\n둘\n셋');
  });

  it('입력한 내용을 그대로 알려준다', async () => {
    const onChange = vi.fn();
    render(<DiaryTextArea text="" onChange={onChange} />);
    await userEvent.type(screen.getByRole('textbox'), '좋');
    expect(onChange).toHaveBeenCalledWith('좋');
  });

  it('글자 수 제한이 없다', () => {
    render(<DiaryTextArea text="" onChange={() => {}} />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.hasAttribute('maxlength')).toBe(false);
  });
});
