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

  it('글자 수는 180자까지만 받는다', () => {
    render(<DiaryTextArea text="" onChange={() => {}} />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.maxLength).toBe(180);
  });

  it('글자 수와 줄 수를 보여준다', () => {
    render(<DiaryTextArea text={'하나\n둘'} onChange={() => {}} />);
    expect(screen.getByText('4 / 180자 · 2 / 6줄')).toBeDefined();
  });

  it('6줄이 차면 엔터로 줄을 더 만들 수 없다', async () => {
    const onChange = vi.fn();
    render(<DiaryTextArea text={'1\n2\n3\n4\n5\n6'} onChange={onChange} />);
    const textarea = screen.getByRole('textbox');
    await userEvent.click(textarea);
    await userEvent.keyboard('{Enter}');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('6줄 미만이면 엔터로 줄을 바꿀 수 있다', async () => {
    const onChange = vi.fn();
    render(<DiaryTextArea text={'1\n2'} onChange={onChange} />);
    await userEvent.click(screen.getByRole('textbox'));
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('1\n2\n');
  });

  it('여러 줄을 붙여넣으면 앞의 6줄만 남긴다', async () => {
    const onChange = vi.fn();
    render(<DiaryTextArea text="" onChange={onChange} />);
    await userEvent.click(screen.getByRole('textbox'));
    await userEvent.paste('1\n2\n3\n4\n5\n6\n7\n8');
    expect(onChange).toHaveBeenCalledWith('1\n2\n3\n4\n5\n6');
  });

  it('한도를 넘겨 쓴 옛 일기는 그대로 보여주고 빨갛게 표시한다', () => {
    const long = '가'.repeat(200);
    render(<DiaryTextArea text={long} onChange={() => {}} />);
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe(long);
    expect(screen.getByText('200 / 180자 · 1 / 6줄').className).toContain('diary-counter-over');
  });
});
