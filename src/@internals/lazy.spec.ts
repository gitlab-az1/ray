import Lazy from './lazy';


describe('@internals/lazy', () => {
  test('it should be ok', () => {
    expect(25 ** (1/2)).toBe(5);
  });
    
  test('should be able to get a lazy value', () => {
    const lazy = new Lazy(() => 25 ** (1/2));
    expect(lazy.value).toBe(5);
  });
    
  test('should be able to get a lazy value once', () => {
    const lazy = new Lazy(() => 25 ** (1/2));
    
    expect(lazy.value).toBe(5);
    expect(lazy.value).toBe(5);
    expect(lazy.value).toBe(5);
  });
    
  test('should be able to get a lazy value without forcing evaluation', () => {
    const lazy = new Lazy(() => 25 ** (1/2));
    expect(lazy.rawValue).toBe(undefined);
  });
    
  test('should be able to get a lazy value without forcing evaluation', () => {
    const lazy = new Lazy(() => 25 ** (1/2));
    expect(lazy.rawValue).toBe(undefined);
  });
    
  test('should be able to get a lazy value without forcing evaluation', () => {
    const lazy = new Lazy(() => 25 ** (1/2));
    expect(lazy.rawValue).toBe(undefined);
  });
    
  test('should be able to get a lazy value without forcing evaluation', () => {
    const lazy = new Lazy(() => 25 ** (1/2));
    expect(lazy.rawValue).toBe(undefined);
  });
    
  test('should be able to get a lazy value without forcing evaluation', () => {
    const lazy = new Lazy(() => 25 ** (1/2));
    expect(lazy.rawValue).toBe(undefined);
  });
    
  test('should be able to get a lazy value without forcing evaluation', () => {
    const lazy = new Lazy(() => 25 ** (1/2));
    expect(lazy.rawValue).toBe(undefined);
  });
    
  test('should be able to get a lazy value without forcing evaluation', () => {
    const lazy = new Lazy(() => 25 ** (1/2));
    expect(lazy.rawValue).toBe(undefined);
  });
    
  test('should be able to get a lazy value without forcing evaluation', () => {
    const lazy = new Lazy(() => 25 ** (1/2));
    expect(lazy.rawValue).toBe(undefined);
  });
});
