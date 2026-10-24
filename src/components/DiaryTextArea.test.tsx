import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DiaryTextArea } from './DiaryTextArea';

// jsdom에는 화면 배치가 없어서, 책 페이지의 줄 수 계산(실제로는 DOM 측정)을 흉내 낸다:
// 엔터로 나뉜 줄마다 10자씩 넘으면 한 줄 더 (빈 줄도 한 줄).
vi.mock('../utils/visualLines', () => ({
  countVisualLines: (text: string) =>
    text.split('\n').reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / 10)), 0),
}));

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
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).maxLength).toBe(180);
  });

  it('글자 수와 책 페이지 기준 줄 수를 보여준다', () => {
    render(<DiaryTextArea text={'하나\n둘'} onChange={() => {}} />);
    expect(screen.getByText('4 / 180자 · 2 / 6줄')).toBeDefined();
    expect(screen.getByText('줄 수는 책(A5 페이지) 기준이에요')).toBeDefined();
  });

  it('엔터 줄이 6줄이 안 돼도 긴 줄이 꺾여 6줄을 채웠으면 더 쓸 수 없다', async () => {
    const onChange = vi.fn();
    // 엔터로는 2줄이지만 책 페이지에서는 5 + 1 = 6줄로 찍힌다
    const text = '가'.repeat(50) + '\n나';
    render(<DiaryTextArea text={text} onChange={onChange} />);
    expect(screen.getByText(`${text.length} / 180자 · 6 / 6줄`)).toBeDefined();
    await userEvent.click(screen.getByRole('textbox'));
    await userEvent.keyboard('{Enter}');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('6줄이 차면 엔터로 줄을 더 만들 수 없다', async () => {
    const onChange = vi.fn();
    render(<DiaryTextArea text={'1\n2\n3\n4\n5\n6'} onChange={onChange} />);
    await userEvent.click(screen.getByRole('textbox'));
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

  it('여러 줄을 붙여넣으면 한도 안에 들어가는 앞부분만 남긴다', async () => {
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
    expect(screen.getByText('200 / 180자 · 20 / 6줄').className).toContain('diary-counter-over');
  });
});
