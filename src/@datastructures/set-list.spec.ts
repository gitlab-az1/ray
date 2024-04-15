import SetList from './set-list';


describe('@datastructures/set-list', () => {
  let setList: SetList<number>;

  beforeEach(() => {
    setList = new SetList<number>();
  });

  describe('add method', () => {
    test('should add a value to the set', () => {
      setList.add(1);
      setList.add(2);

      expect(setList.contains(1)).toBe(true);
      expect(setList.contains(2)).toBe(true);
    });

    test('should not add duplicate values to the set', () => {
      setList.add(1);
      setList.add(2);
      setList.add(1);

      expect(setList.length).toBe(2);
    });
  });

  describe('contains method', () => {
    test('should return true if the value is in the set', () => {
      setList.add(1);

      expect(setList.contains(1)).toBe(true);
    });

    test('should return false if the value is not in the set', () => {
      expect(setList.contains(1)).toBe(false);
    });
  });

  describe('remove method', () => {
    test('should remove the value from the set', () => {
      setList.add(1);
      setList.add(2);

      setList.remove(1);

      expect(setList.contains(1)).toBe(false);
      expect(setList.length).toBe(1);
    });

    test('should return true if the value was removed', () => {
      setList.add(1);

      expect(setList.remove(1)).toBe(true);
    });

    test('should return false if the value was not found', () => {
      expect(setList.remove(1)).toBe(false);
    });
  });

  describe('forEach method', () => {
    test('should iterate over each value in the set', () => {
      setList.add(1);
      setList.add(2);
      setList.add(3);

      const values: number[] = [];
      setList.forEach(value => {
        values.push(value);
      });

      expect(values).toEqual(expect.arrayContaining([1, 2, 3]));
    });

    test('should stop iteration at the specified index', () => {
      setList.add(1);
      setList.add(2);
      setList.add(3);

      const values: number[] = [];

      setList.forEach(value => {
        values.push(value);

        if(value === 2) return 'break';
        return void 0;
      });

      expect(values).toStrictEqual([1, 2]);
    });
  });

  describe('iterator', () => {
    test('should iterate over each value in the set', () => {
      setList.add(1);
      setList.add(2);
      setList.add(3);
    
      const iterator = setList[Symbol.iterator]();
      const values = Array.from(iterator, value => value[1]);
    
      expect(values).toEqual(expect.arrayContaining([1, 2, 3]));
    });

    test('should iterate over each value in reverse', () => {
      setList.add(1);
      setList.add(2);
      setList.add(3);
    
      const iterator = setList.reverseIterator();
      const values = Array.from(iterator, value => value[1]);
    
      expect(values).toEqual(expect.arrayContaining([3, 2, 1]));
    });
  });
});
