import { SortedList } from './sorted-list';


describe('@datastructures/sorted-list', () => {
  test('it should be ok', () => {
    expect(25 ** (1/2)).toBe(5);
  });

  let list: SortedList<string>;

  beforeEach(() => {
    list = new SortedList<string>();
  });

  test('should add items to the list', () => {
    list.add('apple', 3);
    list.add('banana', 2);
    list.add('orange', 4);
    
    expect(list.length).toBe(3);
    expect(list.toArray()).toStrictEqual(['banana', 'apple', 'orange']);
  });

  test('should remove items from the list', () => {
    list.add('apple', 3);
    list.add('banana', 2);
    list.add('orange', 4);

    expect(list.remove('banana')).toBe(true);
    expect(list.length).toBe(2);
    expect(list.toArray()).toStrictEqual(['apple', 'orange']);
  });

  test('should remove items within a range', () => {
    list.add('apple', 3);
    list.add('banana', 2);
    list.add('orange', 4);

    list.removeRange(2, 3);

    expect(list.length).toBe(1);
    expect(list.toArray()).toStrictEqual(['orange']);
  });

  test('should get the minimum and maximum score', () => {
    list.add('apple', 3);
    list.add('banana', 2);
    list.add('orange', 4);

    expect(list.minScore()).toBe(2);
    expect(list.maxScore()).toBe(4);
  });

  test('should get the index of an item', () => {
    list.add('apple', 3);
    list.add('banana', 2);
    list.add('orange', 4);

    expect(list.indexOf('banana')).toBe(0);
    expect(list.indexOf('orange')).toBe(2);
    expect(list.indexOf('grape')).toBe(-1);
  });

  test('should get the indexes of items with a specific score', () => {
    list.add('apple', 3);
    list.add('banana', 2);
    list.add('orange', 4);
    list.add('mango', 3);

    // After sorting, the indexes may change
    expect(list.indexOfScore(3)).toStrictEqual([1, 2]); // Updated to reflect sorted indexes
    expect(list.indexOfScore(2)).toStrictEqual([0]);    // Updated to reflect sorted indexes
    expect(list.indexOfScore(4)).toStrictEqual([3]);    // Updated to reflect sorted indexes
  });

  test('should iterate over items in the list', () => {
    list.add('apple', 3);
    list.add('banana', 2);
    list.add('orange', 4);

    const iterator = list[Symbol.iterator]();
    const items = Array.from(iterator, item => item.value);

    expect(items).toStrictEqual(['banana', 'apple', 'orange']);
  });

  test('should iterate over items in the list in reverse', () => {
    list.add('apple', 3);
    list.add('banana', 2);
    list.add('orange', 4);
    
    const iterator = list.reverseIterator();
    const items = Array.from(iterator, item => item.value);
    
    expect(items).toStrictEqual(['orange', 'apple', 'banana']);
  });

  test('should serialize the list to a JSON string', () => {
    list.add('apple', 3);
    list.add('banana', 2);
    list.add('orange', 4);

    expect(list.toJSON())
      .toStrictEqual('[{"value":"banana","score":2},{"value":"apple","score":3},{"value":"orange","score":4}]');

    expect(JSON.parse(list.toJSON()))
      .toStrictEqual(JSON.parse('[{"value":"banana","score":2},{"value":"apple","score":3},{"value":"orange","score":4}]'));
  });

  test('should select items with a specific score', () => {
    list.add('apple', 3);
    list.add('banana', 2);
    list.add('orange', 4);
    list.add('mango', 3);

    const selected = list.select(3, 4);
    expect(selected).toStrictEqual(['apple', 'mango', 'orange']);
  });

  test('should select items with a specific score returning the score', () => {
    list.add('apple', 3);
    list.add('banana', 2);
    list.add('orange', 4);
    list.add('mango', 3);

    const selected = list.select(3, 4, true);
    
    expect(selected).toStrictEqual([
      ['apple', 3],
      ['mango', 3],
      ['orange', 4],
    ]);
  });

  test('should be able to clear the list', () => {
    list.add('apple', 3);
    list.add('banana', 2);
    list.add('orange', 4);
    
    list.clear();
    
    expect(list.length).toBe(0);
    
    expect(list.indexOf('apple')).toBe(-1);
    expect(list.indexOf('banana')).toBe(-1);
    expect(list.indexOf('orange')).toBe(-1);

    expect(list.indexOfScore(3)).toStrictEqual([]);
    expect(list.indexOfScore(2)).toStrictEqual([]);
    expect(list.indexOfScore(4)).toStrictEqual([]);
  });

  test('should return a set with the items', () => {
    list.add('apple', 3);
    list.add('banana', 2);
    list.add('orange', 4);

    const set = list.toSet();

    expect(set.size).toBe(3);
    
    expect(set.has('apple')).toBe(true);
    expect(set.has('banana')).toBe(true);
    expect(set.has('orange')).toBe(true);
  });

  test('should remove duplicated items', () => {
    list.add('apple', 3);
    list.add('banana', 2);
    list.add('apple', 3);
    list.add('orange', 4);
    list.add('banana', 2);

    expect(list.length).toBe(5);
    
    list.removeDuplicates();
    
    expect(list.length).toBe(3);
    expect(list.toArray()).toStrictEqual(['banana', 'apple', 'orange']);
  });
});
