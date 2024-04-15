import Lazy from './lazy';


describe('@internals/lazy', () => {
  test('it should be ok', () => {
    expect(25 ** (1/2)).toBe(5);
  });

  test('should be able to create a lazy value', () => {
    const lazy = new Lazy(() => 25 ** (1/2));

    expect(lazy).toBeInstanceOf(Lazy);
    expect(lazy.hasValue).toBe(false);
    expect(lazy.rawValue).toBe(undefined);
    expect(lazy.value).toBe(5);
    expect(lazy.hasValue).toBe(true);
    expect(lazy.rawValue).toBe(5);
  });
    
  test('should be able to get a lazy value', () => {
    const lazy = new Lazy(() => 25 ** (1/2));
    expect(lazy.value).toBe(5);
  });
    
  test('should be able to get a lazy value without forcing evaluation', () => {
    const lazy = new Lazy(() => 25 ** (1/2));
    expect(lazy.rawValue).toBe(undefined);
  });
});
