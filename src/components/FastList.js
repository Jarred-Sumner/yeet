// @flow

import * as React from "react";
// $FlowFixMe
import { Animated, View, ScrollView } from "react-native";
import lodash from "lodash";

type HeaderHeight = number | (() => number);
type FooterHeight = number | (() => number);
type SectionHeight = number | ((section: number) => number);
type RowHeight = number | ((section: number, row?: number) => number);
type SectionFooterHeight = number | ((section: number) => number);

export const FastListItemTypes = {
  SPACER: 0,
  HEADER: 1,
  FOOTER: 2,
  SECTION: 3,
  ROW: 4,
  SECTION_FOOTER: 5
};

type FastListItemType = $Values<typeof FastListItemTypes>;

export type FastListItem = {
  type: FastListItemType,
  key: number,
  layoutY: number,
  layoutHeight: number,
  section: number,
  row: number,
  ...
};

export type ScrollEvent = {
  nativeEvent: $ReadOnly<{|
    contentInset: $ReadOnly<{|
      bottom: number,
      left: number,
      right: number,
      top: number
    |}>,
    contentOffset: $ReadOnly<{|
      y: number,
      x: number
    |}>,
    contentSize: $ReadOnly<{|
      height: number,
      width: number
    |}>,
    layoutMeasurement: $ReadOnly<{|
      height: number,
      width: number
    |}>,
    targetContentOffset?: $ReadOnly<{|
      y: number,
      x: number
    |}>,
    velocity?: $ReadOnly<{|
      y: number,
      x: number
    |}>,
    zoomScale?: number,
    responderIgnoreScroll?: boolean
  |}>,
  ...
};

export type LayoutEvent = {
  nativeEvent: $ReadOnly<{|
    layout: $ReadOnly<{|
      x: number,
      y: number,
      width: number,
      height: number
    |}>
  |}>,
  ...
};

/**
 * FastListItemRecycler is used to recycle FastListItem objects between recomputations
 * of the list. By doing this we ensure that components maintain their keys and avoid
 * reallocations.
 */
class FastListItemRecycler {
  static _LAST_KEY: number = 0;

  _items: { [FastListItemType]: { [string]: FastListItem, ... }, ... } = {};
  _pendingItems: { [FastListItemType]: Array<FastListItem>, ... } = {};

  constructor(items: Array<FastListItem>) {
    items.forEach(item => {
      const { type, section, row } = item;
      const [items] = this._itemsForType(type);
      items[`${type}:${section}:${row}`] = item;
    });
  }

  _itemsForType(
    type: FastListItemType
  ): [{ [string]: FastListItem, ... }, Array<FastListItem>] {
    return [
      this._items[type] || (this._items[type] = {}),
      this._pendingItems[type] || (this._pendingItems[type] = [])
    ];
  }

  get(
    type: FastListItemType,
    layoutY: number,
    layoutHeight: number,
    section: number = 0,
    row: number = 0
  ): FastListItem {
    const [items, pendingItems] = this._itemsForType(type);
    return this._get(
      type,
      layoutY,
      layoutHeight,
      section,
      row,
      items,
      pendingItems
    );
  }

  _get(
    type: FastListItemType,
    layoutY: number,
    layoutHeight: number,
    section: number,
    row: number,
    items: { [string]: FastListItem, ... },
    pendingItems: Array<FastListItem>
  ) {
    const itemKey = `${type}:${section}:${row}`;
    let item = items[itemKey];
    if (item == null) {
      item = { type, key: -1, layoutY, layoutHeight, section, row };
      pendingItems.push(item);
    } else {
      item.layoutY = layoutY;
      item.layoutHeight = layoutHeight;
      delete items[itemKey];
    }
    return item;
  }

  fill() {
    lodash.forEach(FastListItemTypes, type => {
      const [items, pendingItems] = this._itemsForType(type);
      this._fill(items, pendingItems);
    });
  }

  _fill(
    items: { [string]: FastListItem, ... },
    pendingItems: Array<FastListItem>
  ) {
    let index = 0;

    lodash.forEach(items, ({ key }) => {
      const item = pendingItems[index];
      if (item == null) {
        return false;
      }
      item.key = key;
      index++;
    });

    for (; index < pendingItems.length; index++) {
      pendingItems[index].key = ++FastListItemRecycler._LAST_KEY;
    }

    pendingItems.length = 0;
  }
}

type FastListComputerProps = {|
  headerHeight: HeaderHeight,
  footerHeight: FooterHeight,
  sectionHeight: SectionHeight,
  rowHeight: RowHeight,
  sectionFooterHeight: SectionFooterHeight,
  sections: Array<number>,
  insetTop: number,
  insetBottom: number
|};

class FastListComputer {
  headerHeight: HeaderHeight;
  footerHeight: FooterHeight;
  sectionHeight: SectionHeight;
  rowHeight: RowHeight;
  sectionFooterHeight: SectionFooterHeight;
  sections: Array<number>;
  insetTop: number;
  insetBottom: number;
  uniform: boolean;

  constructor({
    headerHeight,
    footerHeight,
    sectionHeight,
    rowHeight,
    sectionFooterHeight,
    sections,
    insetTop,
    insetBottom
  }: FastListComputerProps) {
    this.headerHeight = headerHeight;
    this.footerHeight = footerHeight;
    this.sectionHeight = sectionHeight;
    this.rowHeight = rowHeight;
    this.sectionFooterHeight = sectionFooterHeight;
    this.sections = sections;
    this.insetTop = insetTop;
    this.insetBottom = insetBottom;
    this.uniform = typeof rowHeight === "number";
  }

  getHeightForHeader(): number {
    const { headerHeight } = this;
    return typeof headerHeight === "number" ? headerHeight : headerHeight();
  }

  getHeightForFooter(): number {
    const { footerHeight } = this;
    return typeof footerHeight === "number" ? footerHeight : footerHeight();
  }

  getHeightForSection(section: number): number {
    const { sectionHeight } = this;
    return typeof sectionHeight === "number"
      ? sectionHeight
      : sectionHeight(section);
  }

  getHeightForRow(section: number, row?: number): number {
    const { rowHeight } = this;
    return typeof rowHeight === "number" ? rowHeight : rowHeight(section, row);
  }

  getHeightForSectionFooter(section: number): number {
    const { sectionFooterHeight } = this;
    return typeof sectionFooterHeight === "number"
      ? sectionFooterHeight
      : sectionFooterHeight(section);
  }

  compute(
    top: number,
    bottom: number,
    prevItems: Array<FastListItem>
  ): {
    height: number,
    items: Array<FastListItem>,
    ...
  } {
    const { sections } = this;

    let height = this.insetTop;
    let spacerHeight = height;
    let items = [];

    const recycler = new FastListItemRecycler(prevItems);

    function isVisible(itemHeight: number): boolean {
      const prevHeight = height;
      height += itemHeight;
      if (height < top || prevHeight > bottom) {
        spacerHeight += itemHeight;
        return false;
      } else {
        return true;
      }
    }

    function isBelowVisibility(itemHeight: number): boolean {
      if (height > bottom) {
        spacerHeight += itemHeight;
        return false;
      } else {
        return true;
      }
    }

    function push(item: FastListItem) {
      if (spacerHeight > 0) {
        items.push(
          recycler.get(
            FastListItemTypes.SPACER,
            item.layoutY - spacerHeight,
            spacerHeight,
            item.section,
            item.row
          )
        );
        spacerHeight = 0;
      }

      items.push(item);
    }

    let layoutY;

    const headerHeight = this.getHeightForHeader();
    if (headerHeight > 0) {
      layoutY = height;
      if (isVisible(headerHeight)) {
        push(recycler.get(FastListItemTypes.HEADER, layoutY, headerHeight));
      }
    }

    for (let section = 0; section < sections.length; section++) {
      const rows = sections[section];

      if (rows === 0) {
        continue;
      }

      const sectionHeight = this.getHeightForSection(section);
      layoutY = height;
      height += sectionHeight;

      // Replace previous spacers and sections, so we only render section headers
      // whose children are visible + previous section (required for sticky header animation).
      if (
        section > 1 &&
        items.length > 0 &&
        items[items.length - 1].type === FastListItemTypes.SECTION
      ) {
        const spacerLayoutHeight = items.reduce((totalHeight, item, i) => {
          if (i !== items.length - 1) {
            return totalHeight + item.layoutHeight;
          }
          return totalHeight;
        }, 0);
        const prevSection = items[items.length - 1];
        const spacer = recycler.get(
          FastListItemTypes.SPACER,
          0,
          spacerLayoutHeight,
          prevSection.section,
          0
        );
        items = [spacer, prevSection];
      }

      if (isBelowVisibility(sectionHeight)) {
        push(
          recycler.get(
            FastListItemTypes.SECTION,
            layoutY,
            sectionHeight,
            section
          )
        );
      }

      if (this.uniform) {
        const rowHeight = this.getHeightForRow(section);
        for (let row = 0; row < rows; row++) {
          layoutY = height;
          if (isVisible(rowHeight)) {
            push(
              recycler.get(
                FastListItemTypes.ROW,
                layoutY,
                rowHeight,
                section,
                row
              )
            );
          }
        }
      } else {
        for (let row = 0; row < rows; row++) {
          const rowHeight = this.getHeightForRow(section, row);
          layoutY = height;
          if (isVisible(rowHeight)) {
            push(
              recycler.get(
                FastListItemTypes.ROW,
                layoutY,
                rowHeight,
                section,
                row
              )
            );
          }
        }
      }

      const sectionFooterHeight = this.getHeightForSectionFooter(section);
      if (sectionFooterHeight > 0) {
        layoutY = height;
        if (isVisible(sectionFooterHeight)) {
          push(
            recycler.get(
              FastListItemTypes.SECTION_FOOTER,
              layoutY,
              sectionFooterHeight,
              section
            )
          );
        }
      }
    }

    const footerHeight = this.getHeightForFooter();
    if (footerHeight > 0) {
      layoutY = height;
      if (isVisible(footerHeight)) {
        push(recycler.get(FastListItemTypes.FOOTER, layoutY, footerHeight));
      }
    }

    height += this.insetBottom;
    spacerHeight += this.insetBottom;

    if (spacerHeight > 0) {
      items.push(
        recycler.get(
          FastListItemTypes.SPACER,
          height - spacerHeight,
          spacerHeight,
          sections.length
        )
      );
    }

    recycler.fill();

    return {
      height,
      items
    };
  }

  computeScrollPosition(
    targetSection: number,
    targetRow: number
  ): {
    scrollTop: number,
    sectionHeight: number,
    ...
  } {
    const { sections, insetTop } = this;
    let scrollTop = insetTop + this.getHeightForHeader();
    let section = 0;
    let foundRow = false;

    while (section <= targetSection) {
      const rows = sections[section];
      if (rows === 0) {
        section += 1;
        continue;
      }
      scrollTop += this.getHeightForSection(section);
      if (this.uniform) {
        const uniformHeight = this.getHeightForRow(section);
        if (section === targetSection) {
          scrollTop += uniformHeight * targetRow;
          foundRow = true;
        } else {
          scrollTop += uniformHeight * rows;
        }
      } else {
        for (let row = 0; row < rows; row++) {
          if (
            section < targetSection ||
            (section === targetSection && row < targetRow)
          ) {
            scrollTop += this.getHeightForRow(section, row);
          } else if (section === targetSection && row === targetRow) {
            foundRow = true;
            break;
          }
        }
      }
      if (!foundRow) scrollTop += this.getHeightForSectionFooter(section);
      section += 1;
    }

    return {
      scrollTop,
      sectionHeight: this.getHeightForSection(targetSection)
    };
  }
}

const FastListSectionRenderer = ({
  layoutY,
  layoutHeight,
  nextSectionLayoutY,
  scrollTopValue,
  children
}: {
  layoutY: number,
  layoutHeight: number,
  nextSectionLayoutY?: number,
  scrollTopValue: Animated.Value,
  children: React.Node,
  ...
}): React.Node => {
  const inputRange: Array<number> = [-1, 0];
  const outputRange: Array<number> = [0, 0];

  inputRange.push(layoutY);
  outputRange.push(0);
  const collisionPoint = (nextSectionLayoutY || 0) - layoutHeight;
  if (collisionPoint >= layoutY) {
    inputRange.push(collisionPoint, collisionPoint + 1);
    outputRange.push(collisionPoint - layoutY, collisionPoint - layoutY);
  } else {
    inputRange.push(layoutY + 1);
    outputRange.push(1);
  }

  const translateY = scrollTopValue.interpolate({
    inputRange,
    outputRange
  });

  const child = React.Children.only(children);

  return (
    <Animated.View
      style={[
        child.props.style,
        {
          zIndex: 10,
          height: layoutHeight,
          transform: [{ translateY }]
        }
      ]}
    >
      {React.cloneElement(child, {
        style: { flex: 1 }
      })}
    </Animated.View>
  );
};

const FastListItemRenderer = ({
  layoutHeight: height,
  children
}: {
  layoutHeight: number,
  children?: React.Node,
  ...
}): React.Node => <View style={{ height }}>{children}</View>;

export type FastListProps = {
  renderActionSheetScrollViewWrapper?: React.Node => React.Node,
  actionSheetScrollRef?: { current: ?React.Node, ... },
  onScroll?: (event: ScrollEvent) => any,
  onScrollEnd?: (event: ScrollEvent) => any,
  onLayout?: (event: LayoutEvent) => any,
  renderHeader: () => ?React.Element<any>,
  renderFooter: () => ?React.Element<any>,
  renderSection: (section: number) => ?React.Element<any>,
  renderRow: (section: number, row: number) => ?React.Element<any>,
  renderSectionFooter: (section: number) => ?React.Element<any>,
  renderAccessory?: (list: FastList) => React.Node,
  renderEmpty?: () => ?React.Element<any>,
  headerHeight: HeaderHeight,
  footerHeight: FooterHeight,
  sectionHeight: SectionHeight,
  sectionFooterHeight: SectionFooterHeight,
  rowHeight: RowHeight,
  sections: Array<number>,
  insetTop: number,
  insetBottom: number,
  scrollTopValue?: Animated.Value,
  contentInset: {
    top?: number,
    left?: number,
    right?: number,
    bottom?: number,
    ...
  },
  ...
};

type FastListState = {
  batchSize: number,
  blockStart: number,
  blockEnd: number,
  height: number,
  items: Array<FastListItem>,
  ...
};

function computeBlock(
  containerHeight: number,
  scrollTop: number
): $Shape<FastListState> {
  if (containerHeight === 0) {
    return {
      batchSize: 0,
      blockStart: 0,
      blockEnd: 0
    };
  }
  const batchSize = Math.ceil(containerHeight / 2);
  const blockNumber = Math.ceil(scrollTop / batchSize);
  const blockStart = batchSize * blockNumber;
  const blockEnd = blockStart + batchSize;
  return { batchSize, blockStart, blockEnd };
}

function getFastListState(
  {
    headerHeight,
    footerHeight,
    sectionHeight,
    rowHeight,
    sectionFooterHeight,
    sections,
    insetTop,
    insetBottom
  }: FastListProps,
  { batchSize, blockStart, blockEnd, items: prevItems }: $Shape<FastListState>
): any {
  if (batchSize === 0) {
    return {
      batchSize,
      blockStart,
      blockEnd,
      height: insetTop + insetBottom,
      items: []
    };
  }

  const computer = new FastListComputer({
    headerHeight,
    footerHeight,
    sectionHeight,
    rowHeight,
    sectionFooterHeight,
    sections,
    insetTop,
    insetBottom
  });
  return {
    batchSize,
    blockStart,
    blockEnd,
    // $FlowFixMe
    ...(computer.compute(
      blockStart - batchSize,
      blockEnd + batchSize,
      prevItems || []
    ): any) // $FlowFixMe
  };
}

export default class FastList extends React.PureComponent<
  FastListProps,
  FastListState
> {
  static defaultProps = {
    isFastList: true,
    renderHeader: () => null,
    renderFooter: () => null,
    renderSection: () => null,
    renderSectionFooter: () => null,
    headerHeight: 0,
    footerHeight: 0,
    sectionHeight: 0,
    sectionFooterHeight: 0,
    insetTop: 0,
    insetBottom: 0,
    contentInset: { top: 0, right: 0, left: 0, bottom: 0 }
  };

  containerHeight: number = 0;
  scrollTop: number = 0;
  scrollTopValue: Animated.Value =
    this.props.scrollTopValue || new Animated.Value(0);
  scrollTopValueAttachment: ?{ detach: () => void, ... };
  scrollView: { current: ?ScrollView, ... } = React.createRef();

  state = getFastListState(
    this.props,
    computeBlock(this.containerHeight, this.scrollTop)
  );

  static getDerivedStateFromProps(props: FastListProps, state: FastListState) {
    return getFastListState(props, state);
  }

  getItems(): Array<FastListItem> {
    return this.state.items;
  }

  isVisible = (layoutY: number): boolean => {
    return (
      layoutY >= this.scrollTop &&
      layoutY <= this.scrollTop + this.containerHeight
    );
  };

  scrollToLocation = (
    section: number,
    row: number,
    animated?: boolean = true
  ) => {
    const scrollView = this.scrollView.current;
    if (scrollView != null) {
      const {
        headerHeight,
        footerHeight,
        sectionHeight,
        rowHeight,
        sectionFooterHeight,
        sections,
        insetTop,
        insetBottom
      } = this.props;
      const computer = new FastListComputer({
        headerHeight,
        footerHeight,
        sectionHeight,
        sectionFooterHeight,
        rowHeight,
        sections,
        insetTop,
        insetBottom
      });
      const {
        scrollTop: layoutY,
        sectionHeight: layoutHeight
      } = computer.computeScrollPosition(section, row);
      scrollView.scrollTo({
        x: 0,
        y: Math.max(0, layoutY - layoutHeight),
        animated
      });
    }
  };

  handleScroll = (event: ScrollEvent) => {
    const { nativeEvent } = event;
    const { contentInset } = this.props;

    this.containerHeight =
      nativeEvent.layoutMeasurement.height -
      (contentInset.top || 0) -
      (contentInset.bottom || 0);
    this.scrollTop = Math.min(
      Math.max(0, nativeEvent.contentOffset.y),
      nativeEvent.contentSize.height - this.containerHeight
    );

    const nextState = computeBlock(this.containerHeight, this.scrollTop);
    if (
      nextState.batchSize !== this.state.batchSize ||
      nextState.blockStart !== this.state.blockStart ||
      nextState.blockEnd !== this.state.blockEnd
    ) {
      this.setState(nextState);
    }

    const { onScroll } = this.props;
    if (onScroll != null) {
      onScroll(event);
    }
  };

  handleLayout = (event: LayoutEvent) => {
    const { nativeEvent } = event;
    const { contentInset } = this.props;

    this.containerHeight =
      nativeEvent.layout.height -
      (contentInset.top || 0) -
      (contentInset.bottom || 0);

    const nextState = computeBlock(this.containerHeight, this.scrollTop);
    if (
      nextState.batchSize !== this.state.batchSize ||
      nextState.blockStart !== this.state.blockStart ||
      nextState.blockEnd !== this.state.blockEnd
    ) {
      this.setState(nextState);
    }

    const { onLayout } = this.props;
    if (onLayout != null) {
      onLayout(event);
    }
  };
  /**
   * FastList only re-renders when items change which which does not happen with
   * every scroll event. Since an accessory might depend on scroll position this
   * ensures the accessory at least re-renders when scrolling ends
   */
  handleScrollEnd = (event: ScrollEvent) => {
    const { renderAccessory, onScrollEnd } = this.props;
    if (renderAccessory != null) {
      this.forceUpdate();
    }
    onScrollEnd && onScrollEnd(event);
  };

  renderItems() {
    const {
      renderHeader,
      renderFooter,
      renderSection,
      renderRow,
      renderSectionFooter,
      renderEmpty
    } = this.props;

    const { items } = this.state;

    if (renderEmpty != null && this.isEmpty()) {
      return renderEmpty();
    }

    const sectionLayoutYs = [];
    items.forEach(({ type, layoutY }) => {
      if (type === FastListItemTypes.SECTION) {
        sectionLayoutYs.push(layoutY);
      }
    });
    const children = [];
    items.forEach(({ type, key, layoutY, layoutHeight, section, row }) => {
      switch (type) {
        case FastListItemTypes.SPACER: {
          children.push(
            <FastListItemRenderer key={key} layoutHeight={layoutHeight} />
          );
          break;
        }
        case FastListItemTypes.HEADER: {
          const child = renderHeader();
          if (child != null) {
            children.push(
              <FastListItemRenderer key={key} layoutHeight={layoutHeight}>
                {child}
              </FastListItemRenderer>
            );
          }
          break;
        }
        case FastListItemTypes.FOOTER: {
          const child = renderFooter();
          if (child != null) {
            children.push(
              <FastListItemRenderer key={key} layoutHeight={layoutHeight}>
                {child}
              </FastListItemRenderer>
            );
          }
          break;
        }
        case FastListItemTypes.SECTION: {
          sectionLayoutYs.shift();
          const child = renderSection(section);
          if (child != null) {
            children.push(
              <FastListSectionRenderer
                key={key}
                layoutY={layoutY}
                layoutHeight={layoutHeight}
                nextSectionLayoutY={sectionLayoutYs[0]}
                scrollTopValue={this.scrollTopValue}
              >
                {child}
              </FastListSectionRenderer>
            );
          }
          break;
        }
        case FastListItemTypes.ROW: {
          const child = renderRow(section, row);
          if (child != null) {
            children.push(
              <FastListItemRenderer key={key} layoutHeight={layoutHeight}>
                {child}
              </FastListItemRenderer>
            );
          }
          break;
        }
        case FastListItemTypes.SECTION_FOOTER: {
          const child = renderSectionFooter(section);
          if (child != null) {
            children.push(
              <FastListItemRenderer key={key} layoutHeight={layoutHeight}>
                {child}
              </FastListItemRenderer>
            );
          }
          break;
        }
      }
    });

    return children;
  }

  componentDidMount() {
    if (this.scrollView.current != null) {
      this.scrollTopValueAttachment = Animated.attachNativeEvent(
        this.scrollView.current,
        "onScroll",
        [{ nativeEvent: { contentOffset: { y: this.scrollTopValue } } }]
      );
    }
  }

  componentDidUpdate(prevProps: FastListProps) {
    if (prevProps.scrollTopValue !== this.props.scrollTopValue) {
      throw new Error("scrollTopValue cannot changed after mounting");
    }
  }

  componentWillUnmount() {
    if (this.scrollTopValueAttachment != null) {
      this.scrollTopValueAttachment.detach();
    }
  }

  isEmpty = () => {
    const { sections } = this.props;
    const length = sections.reduce((length, rowLength) => {
      return length + rowLength;
    }, 0);
    return length === 0;
  };

  render() {
    const {
      /* eslint-disable no-unused-vars */
      renderSection,
      renderRow,
      renderAccessory,
      sectionHeight,
      rowHeight,
      sections,
      insetTop,
      insetBottom,
      actionSheetScrollRef,
      renderActionSheetScrollViewWrapper,
      renderEmpty,
      /* eslint-enable no-unused-vars */
      ...props
    } = this.props;
    // what is this??
    // well! in order to support continuous scrolling of a scrollview/list/whatever in an action sheet, we need
    // to wrap the scrollview in a NativeViewGestureHandler. This wrapper does that thing that need do
    const wrapper = renderActionSheetScrollViewWrapper || (val => val);
    const scrollView = wrapper(
      <ScrollView
        {...props}
        ref={ref => {
          this.scrollView.current = ref;
          if (actionSheetScrollRef) {
            actionSheetScrollRef.current = ref;
          }
        }}
        removeClippedSubviews={false}
        scrollEventThrottle={16}
        onScroll={this.handleScroll}
        onLayout={this.handleLayout}
        onMomentumScrollEnd={this.handleScrollEnd}
        onScrollEndDrag={this.handleScrollEnd}
      >
        {this.renderItems()}
      </ScrollView>
    );
    return (
      <React.Fragment>
        {scrollView}
        {renderAccessory != null ? renderAccessory(this) : null}
      </React.Fragment>
    );
  }
}
