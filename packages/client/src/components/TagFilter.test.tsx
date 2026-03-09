import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TagFilter } from './TagFilter';

describe('TagFilter', () => {
  const tags = [
    { id: 1, name: 'react' },
    { id: 2, name: 'typescript' },
  ];

  it('renders tag buttons', () => {
    render(<TagFilter tags={tags} activeTag={null} onSelectTag={vi.fn()} />);
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('typescript')).toBeInTheDocument();
  });

  it('calls onSelectTag when tag clicked', async () => {
    const onSelectTag = vi.fn();
    render(<TagFilter tags={tags} activeTag={null} onSelectTag={onSelectTag} />);
    await userEvent.click(screen.getByText('react'));
    expect(onSelectTag).toHaveBeenCalledWith('react');
  });

  it('calls onSelectTag with null when active tag clicked again', async () => {
    const onSelectTag = vi.fn();
    render(<TagFilter tags={tags} activeTag="react" onSelectTag={onSelectTag} />);
    await userEvent.click(screen.getByText('react'));
    expect(onSelectTag).toHaveBeenCalledWith(null);
  });
});
