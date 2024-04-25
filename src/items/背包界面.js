import _ from 'lodash';
import { paginationHTML, genItem as genItemElement } from '../htmlHelper.js';
import { EventType, generalEvents } from '../events/事件管理器.js';
import { settings } from '../settings.js';
import 背包视图 from './背包视图.js';

// TODO: 生成html而不是hard code在index.html
class 背包界面 {
  背包 = null;

  主背包备份 = null;

  背包物品每页数量 = 0;

  activePageIndex = -1;

  addItemHandle = this.addItemCallback.bind(this);

  removeItemHandle= this.removeItemCallback.bind(this)

  constructor(背包, 背包物品每页数量 = settings.背包物品每页数量, activePageIndex = 1) {
    this.背包 = 背包;
    this.主背包备份 = 背包;
    this.背包物品每页数量 = 背包物品每页数量;
    this.resetPaginationNav(activePageIndex);
    this.setActivePageIndex(activePageIndex);

    // 监听搜索按钮的点击事件
    this.getSearchButton().on('click', () => {
      this.performSearch();
    });

    // 监听输入框的键盘按键事件
    this.getSearchInputElement().on('keyup', (event) => {
      // 检查是否按下了回车键 (keyCode 为 13)
      if (event.keyCode === 13) {
        this.performSearch();
      }
    });

    generalEvents.on(EventType.获得物品, this.addItemHandle);
    generalEvents.on(EventType.失去物品, this.removeItemHandle);
  }
  
  // 不注销handler的话object永远被EventEmitter引用着，object就gc不掉
  unregisterHandlers() {
    generalEvents.off(EventType.获得物品, this.addItemHandle);
    generalEvents.off(EventType.失去物品, this.removeItemHandle);
  }

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
    const end = Math.min(this.getInventoryIndex(this.背包物品每页数量), this.背包.items.length);
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

  resetPaginationNav(activePageIndex) {
    const totalPages = Math.max(Math.ceil(this.背包.items.length / this.背包物品每页数量), 1);
    if (activePageIndex > totalPages || activePageIndex < 1) {
      throw new Error();
    }
    const 选择背包分页 = $('#背包面板-选择背包分页');
    选择背包分页.empty();

    // 生成分页栏
    const data = paginationHTML(totalPages, settings.背包页面最大数量, activePageIndex);
    选择背包分页.html(data.html);
    选择背包分页
      .attr('data-start-page-index', data.startPageIndex)
      .attr('data-end-page-index', data.endPageIndex)
      .attr('data-total-pages', data.totalPages)
      .attr('data-active-page-index', activePageIndex);
    // 为每个按钮添加事件
    选择背包分页.find('[data-index]').each((_index, element) => {
      const pageIndex = parseInt($(element).attr('data-index'), 10);
      $(element).on('click', () => {
        if (pageIndex === activePageIndex) {
          $.toast({ message: '已经在这一页了。', displayTime: 1000, class: 'error chinese' });
          return;
        }
        this.resetPaginationNav(pageIndex);
        this.setActivePageIndex(pageIndex);
      });
    });
    选择背包分页.find('.prev-button').on('click', () => {
      if (activePageIndex === 1) {
        $.toast({ message: '已经是第一页了。', displayTime: 1000, class: 'error chinese' });
        return;
      }
      this.resetPaginationNav(activePageIndex - 1);
      this.setActivePageIndex(activePageIndex - 1);
    });
    选择背包分页.find('.next-button').on('click', () => {
      if (activePageIndex === totalPages) {
        $.toast({ message: '已经是最后一页了。', displayTime: 1000, class: 'error chinese' });
        return;
      }
      this.resetPaginationNav(activePageIndex + 1);
      this.setActivePageIndex(activePageIndex + 1);
    });
  }

  addItemCallback({ container, index: inventoryIndex, prevLength }) {
    if(this.背包 !== container) {
      return;
    }

    const activePageIndex = parseInt(
      $('#背包面板-选择背包分页').attr('data-active-page-index'),
      10,
    );
    const previousTotalPages = Math.ceil(prevLength / this.背包物品每页数量);
    const totalPages = Math.ceil(this.背包.items.length / this.背包物品每页数量);

    // 如果获得物品后总页数增加，刷新
    if (totalPages > previousTotalPages) {
      this.resetPaginationNav(activePageIndex);
    }

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

  removeItemCallback({ container, index: inventoryIndex, prevLength }) {
    if(this.背包 !== container) {
      return;
    }

    const activePageIndex = parseInt(
      $('#背包面板-选择背包分页').attr('data-active-page-index'),
      10,
    );
    const previousTotalPages = Math.ceil(prevLength / this.背包物品每页数量);
    const totalPages = Math.max(Math.ceil(this.背包.items.length / this.背包物品每页数量), 1);

    // 如果获得物品后总页数减少，刷新
    if (totalPages < previousTotalPages) {
      const trueActivePageIndex = _.clamp(activePageIndex, 1, totalPages);
      this.resetPaginationNav(trueActivePageIndex);
      if (trueActivePageIndex !== activePageIndex) {
        this.setActivePageIndex(trueActivePageIndex);
        return;
      }
    }

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
    const totalPages = Math.max(1, Math.ceil(this.背包.items.length / this.背包物品每页数量));
    if (index < 1 || index > totalPages) {
      throw new Error();
    }
    this.activePageIndex = index;
    this.getHtml().empty();
    const [start, end] = this.getStartEnd();
    for (let i = start; i < end; i++) {
      const item = this.背包.items[i];
      this.addItem(item, i);
    }
  }

  getSearchInputElement() {
    return $(`#背包面板-背包容器`).find('.搜索输入');
  }

  getSearchButton() {
    return $(`#背包面板-背包容器`).find('.搜索按钮');
  }

  performSearch() {
    const searchText = this.getSearchInputElement().val();
    const prevSearchText = this.getSearchInputElement().data('prev-input');
    if (prevSearchText === searchText) {
      return;
    }

    const filter = (item) => item.name === searchText;
    if (prevSearchText === '') {
      // 全新搜索，创建背包视图
      this.getHtml().empty();
      this.背包 =new 背包视图(this.主背包备份, filter);
    } else if(searchText !== '') {
      // 搜索变化，设置filter
      this.背包.setFilter(filter);
    } else {
      // 搜索变为空，回到主背包
      if(this.背包 === this.主背包备份) {
        throw new Error("之前搜索过，怎么能是一样的？？");
      }
      this.getHtml().empty();
      this.背包.unregisterHandlers();
      this.背包 = this.主背包备份;
    }
    this.resetPaginationNav(1);
    this.setActivePageIndex(1);

    this.getSearchInputElement().data('prev-input', searchText);
  }
}

export default 背包界面;
