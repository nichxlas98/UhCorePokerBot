class List<T> {
    private items: T[];
  
    constructor() {
      this.items = [];
    }

    map(callback: (item: T) => T): T[] {
      return this.items.map(callback);
    }

    addAll(items: T[]): void {
      this.items.push(...items);
    }
  
    // Add an item to the list
    add(item: T): void {
      this.items.push(item);
    }

    addOrReplaceAtIndex(index: number, item: T): void {
      if (index < 0 || index > this.items.length) {
        throw new Error('Index out of bounds');
      }
  
      // If the index is equal to the length, just push the item to the end
      if (index === this.items.length) {
        this.items.push(item);
      } else {
        // Otherwise, insert the item at the specified index
        this.items.splice(index, 0, item);
      }
    }
  
    // Remove an item from the list
    remove(item: T): void {
      const index = this.items.indexOf(item);
      if (index !== -1) {
        this.items.splice(index, 1);
      }
    }

    findIndex(callback: (item: T) => boolean): number {
      for (let i = 0; i < this.items.length; i++) {
        if (callback(this.items[i])) {
          return i;
        }
      }
      return -1; // Return -1 if the element is not found
    }

    find(callback: (item: T) => boolean): T | undefined {
      for (let i = 0; i < this.items.length; i++) {
        if (callback(this.items[i])) {
          return this.items[i];
        }
      }
      return undefined;
    }

    contains(item: T): boolean {
      return this.items.includes(item);
    }

    // Get an item from the list
    get(index: number): T | undefined {
      return this.items[index];
    }
  
    // Get the length of the list
    length(): number {
      return this.items.length;
    }
  
    // Get all items in the list
    getAll(): T[] {
      return this.items.slice(); // Return a copy to prevent external modifications
    }

    forEach(callback: (item: T, index: number) => void): void {
      for (let i = 0; i < this.items.length; i++) {
        callback(this.items[i], i);
      }
    }

    toString(): string {
      return this.items.toString();
    }

    asArray(): T[] {
      return this.items
    }
}

export default List;