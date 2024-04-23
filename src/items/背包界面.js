import _ from 'lodash';
import { genItem as genItemElement ,paginationHTML} from '../htmlHelper.js';
import { EventType, generalEvents } from '../events/事件管理器.js';
import { settings } from '../settings.js';



// TODO: 生成html而不是hard code在index.html
class 背包界面 {
  背包 = null;

  背包物品每页数量 = 0;

  activePageIndex = 1;

  // eslint-disable-next-line class-methods-use-this
  getHtml() {
    return $(`#背包面板-背包`);
  }

  getLength() {
    return this.getHtml().children('.column').length;
  }

  locElement(index) {
    if (index === -1) {
      return this.getHtml().children('.column').last();
    }
    return this.getHtml().children('.column').eq(index);
  }

  getInventoryIndex(containerIndex) {
    return (this.activePageIndex - 1) * this.背包物品每页数量 + containerIndex;
  }

  getContainerIndex(inventoryIndex) {
    return inventoryIndex - (this.activePageIndex - 1) * this.背包物品每页数量;
  }

  // Display items in [start, end)
  getStartEnd() {
    const start = this.getInventoryIndex(0);
    const end = Math.min(
      this.getInventoryIndex(this.背包物品每页数量),
      this.背包.items.length,
    );
    return [start, end];
  }

  addItem(item, inventoryIndex) {
    const index = this.getContainerIndex(inventoryIndex);
    const length = this.getLength();
    if (index > length || index < 0) {
      throw new Error();
    }

    const newItemElement = genItemElement(item);
    if (index === length) {
      this.getHtml().append(newItemElement);
    } else {
      this.locElement(index).before(newItemElement);
    }

    // 超出大小则清理末尾一格
    if (length > this.背包物品每页数量) {
      this.locElement(-1).remove();
    }
  }

  updateItem(item, inventoryIndex) {
    const index = this.getContainerIndex(inventoryIndex);
    if (index >= this.getLength() || index < 0) {
      throw new Error();
    }

    const newItemElement = genItemElement(item);
    this.locElement(index).replaceWith(newItemElement);
  }

  removeItem(inventoryIndex) {
    const index = this.getContainerIndex(inventoryIndex);
    if (index >= this.getLength() || index < 0) {
      throw new Error();
    }

    this.locElement(index).remove();
  }

  addItemCallback({ index: inventoryIndex, prevLength }) {
    const [start, end] = this.getStartEnd();
    if (prevLength !== this.背包.items.length) {
      // 增加slot
      if (inventoryIndex < start) {
        // 前
        const item = this.背包.items[start - 1];
        this.addItem(item, start);
      } else if (inventoryIndex < end) {
        // 中
        const item = this.背包.items[inventoryIndex];
        this.addItem(item, inventoryIndex);
      }
    } else if (_.inRange(inventoryIndex, start, end)) {
      // 增加stack
      this.updateItem(inventoryIndex);
    }
  }

  removeItemCallback({ index: inventoryIndex, prevLength }) {
    const [start, end] = this.getStartEnd();
    if (prevLength !== this.背包.items.length) {
      // 删除slot
      if (inventoryIndex < start + this.getLength()) {
        // 前/中
        this.removeItem(Math.max(start, inventoryIndex));
        const lastIndex = this.getInventoryIndex(this.背包物品每页数量 - 1);
        if (this.背包.items.length > lastIndex) {
          const item = this.背包.items[lastIndex];
          this.addItem(item, lastIndex);
        }
      }
    } else if (_.inRange(inventoryIndex, start, end)) {
      // 减少stack
      this.updateItem(inventoryIndex);
    }
  }

  setActivePageIndex(index) {
    this.activePageIndex = index;
    this.getHtml().empty();
    const [start, end] = this.getStartEnd();
    for (let i = start; i < end; i++) {
      const item = this.背包.items[i];
      this.addItem(item, i);
    }
  }

  constructor(
    背包,
    背包物品每页数量 = settings.背包物品每页数量,
    activePageIndex = 1,
  ) {
    this.背包 = 背包;
    this.背包物品每页数量 = 背包物品每页数量;
    this.setActivePageIndex(activePageIndex);

    generalEvents.on(EventType.获得物品, this.addItemCallback.bind(this));
    generalEvents.on(EventType.失去物品, this.removeItemCallback.bind(this));
  }
}

export default 背包界面;
