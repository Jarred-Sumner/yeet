import lodash from "lodash";
import * as React from "react";
import Animated from "react-native-reanimated";
import {
  View,
  ViewStyle,
  StyleSheet,
  NativeScrollEvent,
  LayoutChangeEvent,
  findNodeHandle,
  ScrollView,
  ScrollViewProps
} from "react-native";
import { ViewabilityHelper } from "./ViewabilityHelper";
import { NativeViewGestureHandler } from "react-native-gesture-handler";
import { SCREEN_DIMENSIONS } from "../../config";

type HeaderHeight = number | (() => number);
type FooterHeight = number | (() => number);
type SectionHeight = number | ((section: number) => number);
type RowHeight = number | ((section: number, row?: number) => number);
type SectionFooterHeight = number | ((section: number) => number);

let DEBUG_MODE = false;

export enum ScrollDirection {
  neutral = 0,
  down = -1,
  up = 1
}

export enum FastListItemType {
  spacer = 0,
  header = 1,
  footer = 2,
  section = 3,
  row = 4,
  sectionFooter = 5
}

const FastListItemTypes = [
  FastListItemType.spacer,
  FastListItemType.header,
  FastListItemType.footer,
  FastListItemType.section,
  FastListItemType.row,
  FastListItemType.sectionFooter
];

interface FastListComputerProps {
  headerHeight: HeaderHeight;
  footerHeight: FooterHeight;
  sectionHeight: SectionHeight;
  listKey: string | null;
  rowHeight: RowHeight;
  sectionFooterHeight: SectionFooterHeight;
  sections: number[];
  insetTop: number;
  insetBottom: number;
}

export type FastListItem = {
  type: FastListItemType;
  key: number;
  layoutY: number;
  layoutHeight: number;
  section: number;
  row: number;
};

export class FastListComputer {
  headerHeight: HeaderHeight;
  footerHeight: FooterHeight;
  sectionHeight: SectionHeight;
  rowHeight: RowHeight;
  sectionFooterHeight: SectionFooterHeight;
  sections: number[];
  insetTop: number;
  insetBottom: number;
  uniform: boolean;
  listKey: string | null;

  constructor({
    headerHeight,
    footerHeight,
    sectionHeight,
    rowHeight,
    sectionFooterHeight,
    listKey,
    sections,
    insetTop,
    insetBottom
  }: FastListComputerProps) {
    this.headerHeight = headerHeight;
    this.footerHeight = footerHeight;
    this.sectionHeight = sectionHeight;
    this.listKey = listKey;
    this.rowHeight = rowHeight;
    this.sectionFooterHeight = sectionFooterHeight;
    this.sections = sections;
    this.insetTop = insetTop;
    this.insetBottom = insetBottom;
    this.uniform = typeof rowHeight === "number";
  }

  getHeightForHeader(): number {
    const { headerHeight } = this;
    console.log(headerHeight);
    if (typeof headerHeight === "number") {
      return headerHeight;
    } else if (typeof headerHeight === "function") {
      return headerHeight({ listKey: this.listKey });
    } else {
      return 0;
    }
  }

  getHeightForFooter(): number {
    const { footerHeight } = this;
    if (typeof footerHeight === "number") {
      return footerHeight;
    } else if (typeof footerHeight === "function") {
      return footerHeight({ listKey: this.listKey });
    } else {
      return 0;
    }
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
    prevItems: FastListItem[]
  ): {
    height: number;
    items: FastListItem[];
  } {
    const { sections } = this;

    let height = this.insetTop;
    let spacerHeight = Math.max(height, 0);
    let items = [] as FastListItem[];

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
            FastListItemType.spacer,
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
        push(recycler.get(FastListItemType.header, layoutY, headerHeight));
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
        items[items.length - 1].type === FastListItemType.section
      ) {
        const spacerLayoutHeight = items.reduce((totalHeight, item, i) => {
          if (i !== items.length - 1) {
            return totalHeight + item.layoutHeight;
          }
          return totalHeight;
        }, 0);
        const prevSection = items[items.length - 1];
        const spacer = recycler.get(
          FastListItemType.spacer,
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
            FastListItemType.section,
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
                FastListItemType.row,
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
                FastListItemType.row,
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
              FastListItemType.sectionFooter,
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
        push(recycler.get(FastListItemType.footer, layoutY, footerHeight));
      }
    }

    height += this.insetBottom;
    spacerHeight += this.insetBottom;

    if (spacerHeight > 0) {
      items.push(
        recycler.get(
          FastListItemType.spacer,
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
    scrollTop: number;
    sectionHeight: number;
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
      if (!foundRow) {
        scrollTop += this.getHeightForSectionFooter(section);
      }
      section += 1;
    }

    return {
      scrollTop,
      sectionHeight: this.getHeightForSection(targetSection)
    };
  }
}

/**
 * FastListItemRecycler is used to recycle FastListItem objects between
 * recomputations of the list. By doing this we ensure that components
 * maintain their keys and avoid reallocations.
 */
export class FastListItemRecycler {
  static _LAST_KEY: number = 0;

  items: {
    [key: number]: {
      [key: string]: FastListItem;
    };
  } = {};
  pendingItems: {
    [key: number]: FastListItem[];
  } = {};

  constructor(items: FastListItem[]) {
    items.forEach(item => {
      const { type, section, row } = item;
      const [itemsForType] = this.itemsForType(type);
      itemsForType[`${type}:${section}:${row}`] = item;
    });
  }

  itemsForType(
    type: FastListItemType
  ): [
    {
      [key: string]: FastListItem;
    },
    FastListItem[]
  ] {
    return [
      this.items[type] || (this.items[type] = {}),
      this.pendingItems[type] || (this.pendingItems[type] = [])
    ];
  }

  get(
    type: FastListItemType,
    layoutY: number,
    layoutHeight: number,
    section: number = 0,
    row: number = 0
  ): FastListItem {
    const [items, pendingItems] = this.itemsForType(type);
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
    items: {
      [key: string]: FastListItem;
    },
    pendingItems: FastListItem[]
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
      const [items, pendingItems] = this.itemsForType(type);
      this._fill(items, pendingItems);
    });
  }

  _fill(
    items: {
      [key: string]: FastListItem;
    },
    pendingItems: FastListItem[]
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

const FastListItemRenderer = ({
  layoutHeight: height,
  spacer,
  children
}: {
  layoutHeight: number;
  children?: React.ReactNode;
}) => (
  <View
    height={height}
    style={
      DEBUG_MODE
        ? {
            height,
            backgroundColor: spacer ? "blue" : "red"
          }
        : { height }
    }
  >
    {children}
  </View>
);

export interface FastListProps {
  listKey: string | null;
  renderActionSheetScrollViewWrapper?: (
    wrapper: React.ReactNode
  ) => React.ReactNode;
  ScrollViewComponent: React.ComponentType<ScrollViewProps>;
  actionSheetScrollRef?: { current: React.ReactNode | null | undefined };
  onScroll?: (event: NativeScrollEvent) => any;
  onScrollEnd?: (event: NativeScrollEvent) => any;
  onLayout?: (event: LayoutChangeEvent) => any;
  renderHeader: () => React.ReactElement<any> | null | undefined;
  renderFooter: () => React.ReactElement<any> | null | undefined;
  renderSection: (
    section: number
  ) => React.ReactElement<any> | null | undefined;
  renderRow: (
    section: number,
    row: number
  ) => React.ReactElement<any> | null | undefined;
  renderSectionFooter: (
    section: number
  ) => React.ReactElement<any> | null | undefined;
  renderAccessory?: (list: FastList) => React.ReactNode;
  renderEmpty?: () => React.ReactElement<any> | null | undefined;
  headerHeight: HeaderHeight;
  footerHeight: FooterHeight;
  sectionHeight: SectionHeight;
  sectionFooterHeight: SectionFooterHeight;
  rowHeight: RowHeight;
  sections: number[];
  insetTop: number;
  insetBottom: number;
  scrollTopValue?: Animated.Value;
  contentInset: {
    top?: number;
    left?: number;
    right?: number;
    bottom?: number;
  };
}

interface FastListState {
  batchSize: number;
  blockStart: number;
  isEmpty: boolean;
  blockEnd: number;
  height?: number;
  items?: FastListItem[];
}

const computeBlock = (
  containerHeight: number,
  scrollTop: number
): FastListState => {
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
};

const NATIVE_WRAPPER_PROPS_FILTER = [
  "id",
  "minPointers",
  "enabled",
  "waitFor",
  "simultaneousHandlers",
  "shouldCancelWhenOutside",
  "hitSlop",
  "onGestureEvent",
  "onHandlerStateChange",
  "onBegan",
  "onFailed",
  "onCancelled",
  "onActivated",
  "onEnded",
  "shouldActivateOnStart",
  "disallowInterruption",
  "onGestureHandlerEvent",
  "onGestureHandlerStateChange"
];

function getFastListState(
  {
    headerHeight,
    footerHeight,
    sectionHeight,
    rowHeight,
    sectionFooterHeight,
    sections,
    insetTop,
    insetBottom,
    listKey
  }: FastListProps,
  { batchSize, blockStart, blockEnd, items: prevItems }: FastListState
): FastListState {
  if (batchSize === 0) {
    return {
      batchSize,
      blockStart,
      blockEnd,
      isEmpty: true,
      height: insetTop + insetBottom,
      items: []
    };
  }
  const computer = new FastListComputer({
    headerHeight,
    footerHeight,
    sectionHeight,
    listKey,
    rowHeight,
    sectionFooterHeight,
    sections,
    insetTop,
    insetBottom
  });

  const results = computer.compute(
    blockStart - batchSize,
    blockEnd + batchSize,
    prevItems || []
  );

  return {
    batchSize,
    blockStart,
    blockEnd,
    isEmpty:
      sections.reduce((total, rowLength) => {
        return total + rowLength;
      }, 0) === 0,
    ...results
  };
}

const FastListSectionRenderer = ({
  layoutY,
  layoutHeight,
  sticky = true,
  nextSectionLayoutY,
  scrollTopValue,
  children
}: {
  layoutY: number;
  layoutHeight: number;
  nextSectionLayoutY?: number;
  scrollTopValue: Animated.Value<number>;
  children: React.ReactElement<{ style?: ViewStyle }>;
}) => {
  let translateY;

  if (sticky) {
    const inputRange: number[] = [-1, 0];
    const outputRange: number[] = [0, 0];

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

    translateY = scrollTopValue.interpolate({
      inputRange,
      outputRange
    });
  } else {
    translateY = 0;
  }

  const child = React.Children.only(children);

  return (
    <Animated.View
      style={[
        React.isValidElement(child) && child.props.style
          ? child.props.style
          : undefined,
        {
          zIndex: 10,
          height: layoutHeight,
          transform: [{ translateY }]
        }
      ]}
    >
      {React.isValidElement(child) &&
        React.cloneElement(child, {
          style: { flex: 1 }
        })}
    </Animated.View>
  );
};

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
    containerHeight: SCREEN_DIMENSIONS.height,
    insetBottom: 0,
    contentOffset: { x: 0, y: 0 },
    contentInset: { top: 0, right: 0, left: 0, bottom: 0 }
  };

  constructor(props) {
    super(props);
    this.containerHeight = props.containerHeight;
    this.scrollTop = props.contentInset.top * -1;
    this.scrollTopValue =
      this.props.scrollTopValue ?? new Animated.Value(this.scrollTop);
    this.state = getFastListState(
      props,
      computeBlock(this.containerHeight, this.scrollTop)
    );
  }

  containerHeight: number;
  scrollTop: number;
  scrollTopValue: Animated.Value<number>;
  scrollTopValueAttachment: { detach: () => void } | null | undefined;
  scrollView: { current: ScrollView | null | undefined } = React.createRef();

  static getDerivedStateFromProps(props: FastListProps, state: FastListState) {
    return getFastListState(props, state);
  }

  getItems(): FastListItem[] {
    return this.state.items || [];
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
    animated: boolean = true
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

  scrollToTop = (animated = true) => {
    this.scrollView?.current?.scrollTo({
      x: 0,
      y: this.props?.contentOffset?.y ?? 0,
      animated
    });
  };

  handleScroll = (event: Event) => {
    const { nativeEvent } = event;
    const { insetTop, insetBottom } = this.props;

    if (nativeEvent.contentOffset.y > this.scrollTop) {
      this.scrollDirection = ScrollDirection.down;
    } else if (nativeEvent.contentOffset.y < this.scrollTop) {
      this.scrollDirection = ScrollDirection.up;
    }

    if (nativeEvent.layoutMeasurement.height > 0) {
      this.containerHeight = nativeEvent.layoutMeasurement.height;
    }

    this.scrollTop = nativeEvent.contentOffset.y;

    const nextState = computeBlock(this.containerHeight, this.scrollTop);
    if (
      nextState.batchSize !== this.state.batchSize ||
      nextState.blockStart !== this.state.blockStart ||
      nextState.blockEnd !== this.state.blockEnd
    ) {
      let _nativeEvent = { nativeEvent: event.nativeEvent };
      this.setState(nextState, () => {
        if (
          this.scrollDirection === ScrollDirection.down &&
          this.scrollTop + this.state.batchSize * 2 >= this.state.height
        ) {
          this._onScrollEnd(this.decorateEvent(_nativeEvent));
        }

        _nativeEvent = null;
      });
    } else {
      if (
        this.scrollDirection === ScrollDirection.down &&
        this.scrollTop + this.state.batchSize * 2 >= this.state.height
      ) {
        this._onScrollEnd(this.decorateEvent(event));
      }
    }

    const { onScroll } = this.props;
    if (onScroll != null) {
      onScroll(this.decorateEvent(event));
    }

    this.hasScrolled = true;
  };

  _onScrollEnd = lodash.throttle(event => {
    this.props.onScrollEnd && this.props.onScrollEnd(event);
  }, 20);
  hasScrolled = false;

  handleLayout = (event: LayoutChangeEvent) => {
    const { nativeEvent } = event;
    const { insetTop, insetBottom } = this.props;
    const { containerHeight, scrollTop } = this;

    this.containerHeight = nativeEvent.layout.height;

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

  scrollDirection: ScrollDirection = ScrollDirection.neutral;

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
    if (onScrollEnd) {
      onScrollEnd(this.decorateEvent(event));
    }

    this.scrollDirection = ScrollDirection.neutral;
  };

  renderItems() {
    const {
      renderHeader,
      renderFooter,
      renderSection,
      renderRow,
      renderSectionFooter,
      renderEmpty,
      isLoading,
      height,
      listKey,
      stickyHeaders
    } = this.props;

    const { items = [], isEmpty } = this.state;

    if (renderEmpty != null && isEmpty) {
      return renderEmpty({ isLoading, height, listKey });
    }

    const sectionLayoutYs = [] as number[];
    items.forEach(({ type, layoutY }) => {
      if (type === FastListItemType.section) {
        sectionLayoutYs.push(layoutY);
      }
    });

    const visibleItems = [];
    const children = [] as JSX.Element[];
    items.forEach(({ type, key, layoutY, layoutHeight, section, row }) => {
      switch (type) {
        case FastListItemType.spacer: {
          const child = (
            <FastListItemRenderer
              spacer
              key={key}
              layoutHeight={layoutHeight}
            />
          );
          children.push(child);
          break;
        }
        case FastListItemType.header: {
          const HeaderComponent = renderHeader;
          if (HeaderComponent != null) {
            children.push(
              <FastListItemRenderer key={key} layoutHeight={layoutHeight}>
                <HeaderComponent listKey={this.props.listKey} />
              </FastListItemRenderer>
            );
          }
          break;
        }
        case FastListItemType.footer: {
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
        case FastListItemType.section: {
          sectionLayoutYs.shift();
          const child = renderSection(section);
          if (child != null) {
            children.push(
              <FastListSectionRenderer
                key={key}
                sticky={stickyHeaders}
                translateY={this.props.translateY}
                minY={this.props.contentOffset.y - this.props.headerHeight ?? 0}
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
        case FastListItemType.row: {
          const child = renderRow(section, row);
          if (child != null) {
            visibleItems.push(row);
            children.push(
              <FastListItemRenderer key={key} layoutHeight={layoutHeight}>
                {child}
              </FastListItemRenderer>
            );
          }
          break;
        }
        case FastListItemType.sectionFooter: {
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

    this.visibleRows = visibleItems;
    return children;
  }

  componentDidMount() {
    if (this.scrollView.current !== null) {
      const nativeEvent = { contentOffset: { y: this.scrollTopValue } };
      if (this.props.insetTopValue) {
        nativeEvent.contentInset = { top: this.props.insetTopValue };
      }

      // @ts-ignore: Types for React Native doesn't include attachNativeEvent
      this.scrollTopValueAttachment = Animated.event([
        { nativeEvent },
        { useNativeDriver: true }
      ]);

      this.scrollTopValueAttachment.attachEvent(
        findNodeHandle(this.scrollView.current),
        "onScroll"
      );
    }
  }

  componentWillUnmount() {
    if (this.scrollTopValueAttachment != null) {
      this.scrollTopValueAttachment.detachEvent(
        findNodeHandle(this.scrollView.current),
        "onScroll"
      );
    }
  }

  componentDidUpdate(prevProps: FastListProps, prevState) {
    if (prevProps.scrollTopValue !== this.props.scrollTopValue) {
      throw new Error("scrollTopValue cannot changed after mounting");
    }
  }

  isEmpty = () => {
    const { sections } = this.props;
    const length = sections.reduce((total, rowLength) => {
      return total + rowLength;
    }, 0);
    return length === 0;
  };

  getScrollView() {
    return this.scrollView.current;
  }

  handleScrollBeginDrag = event => {
    const {
      nativeEvent: {
        contentOffset: { y }
      }
    } = event;

    if (this.scrollTop < y) {
      this.scrollDirection = ScrollDirection.up;
    } else {
      this.scrollDirection = ScrollDirection.down;
    }

    this.props.onScrollBeginDrag &&
      this.props.onScrollBeginDrag(this.decorateEvent(event));
  };
  handleScrollEndDrag = event => {
    const {
      nativeEvent: {
        contentOffset: { y },
        targetContentOffset: { y: targetY }
      }
    } = event;

    if (y > targetY) {
      this.scrollDirection = ScrollDirection.up;
    } else {
      this.scrollDirection = ScrollDirection.down;
    }

    this._onScrollEndDrag && this._onScrollEndDrag(this.decorateEvent(event));

    // The final block!
    if (
      this.scrollDirection === ScrollDirection.down &&
      targetY + this.state.batchSize * 2 >= this.state.height
    ) {
      this._onScrollEnd(this.decorateEvent(event));
    }
  };

  visibleRows = [];

  decorateEvent = event => {
    event.nativeEvent.direction = this.scrollDirection;
    event.nativeEvent.visibleRows = this.visibleRows;

    return { nativeEvent: event.nativeEvent };
  };

  render() {
    const {
      /* eslint-disable no-unused-vars */
      renderSection,
      renderRow,
      containerHeight,
      renderAccessory,
      sectionHeight,
      rowHeight,
      sections,
      insetTop,
      renderHeader,
      headerHeight,
      insetBottom,
      actionSheetScrollRef,
      renderActionSheetScrollViewWrapper,
      translateY,
      height,
      insetTopValue,
      listKey,
      scrollTopValue,
      style,
      contentContainerStyle = styles.contentContainer,
      contentOffset,
      renderEmpty,
      isLoading = false,
      contentInsetAdjustmentBehavior,
      maintainVisibleContentPosition,
      id,
      minPointers,
      enabled,
      waitFor,
      simultaneousHandlers,
      shouldCancelWhenOutside,
      hitSlop,
      onGestureEvent,
      onHandlerStateChange,
      onBegan,
      onFailed,
      onCancelled,
      onActivated,
      onEnded,
      shouldActivateOnStart,
      disallowInterruption,
      onGestureHandlerEvent,
      onGestureHandlerStateChange,
      /* eslint-enable no-unused-vars */
      ...props
    } = this.props;
    // what is this??
    // well! in order to support continuous scrolling of a scrollview/list/whatever in an action sheet, we need
    // to wrap the scrollview in a NativeViewGestureHandler. This wrapper does that thing that need do
    if (this.state.isEmpty && !isLoading && typeof renderEmpty === "function") {
      return renderEmpty({ isLoading: false, height: height });
    }

    const scrollView = (
      <NativeViewGestureHandler
        id={id}
        minPointers={minPointers}
        enabled={enabled}
        waitFor={waitFor}
        simultaneousHandlers={simultaneousHandlers}
        shouldCancelWhenOutside={shouldCancelWhenOutside}
        hitSlop={hitSlop}
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        onBegan={onBegan}
        onFailed={onFailed}
        onCancelled={onCancelled}
        onActivated={onActivated}
        onEnded={onEnded}
        shouldActivateOnStart={shouldActivateOnStart}
        disallowInterruption={disallowInterruption}
        onGestureHandlerEvent={onGestureHandlerEvent}
        onGestureHandlerStateChange={onGestureHandlerStateChange}
      >
        <ScrollView
          {...props}
          ref={ref => {
            this.scrollView.current = ref;
            if (actionSheetScrollRef) {
              actionSheetScrollRef.current = ref;
            }
          }}
          removeClippedSubviews={false}
          directionalLockEnabled
          height={height}
          scrollEventThrottle={16}
          style={style}
          // maintainVisibleContentPosition
          scrollToOverflowEnabled
          contentOffset={contentOffset}
          automaticallyAdjustContentInsets={false}
          contentContainerStyle={contentContainerStyle}
          contentInsetAdjustmentBehavior="never"
          onScroll={this.handleScroll}
          onLayout={this.handleLayout}
          onMomentumScrollEnd={this.handleScrollEnd}
          onScrollEndDrag={this.handleScrollEndDrag}
          onScrollBeginDrag={this.handleScrollBeginDrag}
        >
          {this.renderItems()}
        </ScrollView>
      </NativeViewGestureHandler>
    );

    if (!renderAccessory) {
      return scrollView;
    } else {
      return (
        <React.Fragment>
          {scrollView}
          {renderAccessory != null ? renderAccessory(this) : null}
        </React.Fragment>
      );
    }
  }
}

const styles = StyleSheet.create({
  contentContainer: DEBUG_MODE
    ? { backgroundColor: "pink", flexGrow: 1 }
    : { flexGrow: 1 }
});
