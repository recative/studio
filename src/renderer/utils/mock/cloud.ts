import { sample } from 'lodash';
import { nanoid } from 'nanoid';
import { hacker, lorem } from 'faker';

enum DataSlot {
  Boolean = 'boolean',
  Number = 'number',
  String = 'string',
  Complex = 'complex',
}

export interface IDataSlotItem {
  id: string;
  slotId: string;
  type: DataSlot;
  public: boolean;
  notes: string;
  createTime: number;
  updateTime: number;
}

export const generateRandomDataSlot = (count: number): IDataSlotItem[] => {
  return Array(count)
    .fill(0)
    .map(() => ({
      id: nanoid(),
      slotId: `${hacker.verb()}_${hacker.adjective()}_${hacker.noun()}`
        .toUpperCase()
        .replaceAll(' ', '_')
        .replaceAll('-', '_'),
      type: sample(['boolean', 'number', 'string', 'complex']) as DataSlot,
      public: Math.random() >= 0.5,
      notes: lorem.sentence(),
      createTime: Date.now() - Math.round(Math.random() * 365 * 24 * 60 * 60),
      updateTime: Date.now() - Math.round(Math.random() * 365 * 24 * 60 * 60),
    }));
};
