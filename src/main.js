/* eslint-disable */
let snabbdom = window.snabbdom;
const h = snabbdom.h;
const patch = snabbdom.init([
  snabbdom_class.default,
  snabbdom_props.default,
  snabbdom_style.default,
  snabbdom_eventlisteners.default
]);

// csv原始数据
let rawBill = null;
let rawCategory = null;

// 上次更新的vnode
let oldVode = null;

let cachaCategoryName = new Map();

// filter条件，通过proxy, 触发set方式时候，重新render page
let filter = new Proxy(
  {},
  {
    set: function (obj, prop, value) {
      obj[prop] = value;

      // filter result
      const filterBill = rawBill.filter(
        (item) =>
          filterMonth(item.time, obj.month) &&
          filterCategory(item.category, obj.category)
      );

      render(filterBill);

      return true;
    }
  }
);

// 时间转换
const time = (time) => {
  var date = new Date(Number(time) + 8 * 3600 * 1000); // 增加8小时
  return date.toJSON().substr(0, 19).replace("T", " ");
};

// 获取时间戳月份
const getBillMonth = (timestamp) => {
  return new Date(Number(timestamp)).getMonth() + 1;
};

// 过滤月份
const filterMonth = (timestamp, value) => {
  return value ? new Date(Number(timestamp)).getMonth() + 1 == value : true;
};

// 过滤分类
const filterCategory = (categoryId, value) => {
  return value ? getCategoryName(categoryId) == value : true;
};

// 根据id找出category name, 增加缓存处理
const getCategoryName = (categoryId) => {
  if (cachaCategoryName.has(categoryId)) {
    return cachaCategoryName[categoryId];
  } else {
    let name = rawCategory.find((item) => item.id == categoryId).name;
    cachaCategoryName.set(categoryId.name);
    return name;
  }
};

// 计算支出收入总额
const getTotalAmount = (bill) => {
  return bill.reduce(
    (result, { type, amount, category }) => {
      if (type == 0) {
        result.total.spending += Number(amount);
        const categoryName = getCategoryName(category);
        result.category[categoryName] =
          Number(result.category[categoryName] || 0) + Number(amount);
      } else if (type == 1) {
        result.total.income += Number(amount);
      }
      return result;
    },
    {
      total: {
        income: 0, // 收入
        spending: 0 // 支出
      },
      category: {}
    }
  );
};

// 更新filter value
const setCondition = (key, value) => {
  filter[key] = value;
};

// 渲染page
const render = (bill, el = null) => {
  const Header = ["账单类型", "账单时间", "账单分类", "账单金额"];
  const Months = [
    "",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12"
  ];
  const Categorys = ["", ...new Set(rawCategory.map((item) => item.name))];

  const createTableHeader = (header) => {
    return h(
      "tr",
      {},
      header.map((name) => h("th", {}, name))
    );
  };
  const createTableData = (billList) => {
    return billList.map((item) =>
      h("tr", [
        h("td", {}, item.type == 0 ? "支出" : "收入"),
        h("td", {}, time(item.time)),
        h("td", {}, getCategoryName(item.category)),
        h("td", {}, item.amount)
      ])
    );
  };

  const FilterHeader = h("div", {}, [
    h("div.dropdown", [
      h(
        "div.dropbtn",
        `选择月份：${filter.month ? `${filter.month}月` : "全部"}`
      ),
      h(
        "div.dropdown-content",
        Months.map((value) => {
          return h(
            "span",
            { on: { click: [setCondition, "month", value] } },
            value == "" ? "全部" : `${value}月`
          );
        })
      )
    ]),
    h("div.dropdown-category", [
      h(
        "div.dropbtn-category",
        `选择分类：${filter.category ? filter.category : "全部"}`
      ),
      h(
        "div.dropdown-content-category",
        Categorys.map((value) => {
          return h(
            "span",
            { on: { click: [setCondition, "category", value] } },
            value == "" ? "全部" : value
          );
        })
      )
    ])
  ]);

  const TableContent = h("table.gridtable", {}, [
    createTableHeader(Header),
    ...createTableData(bill)
  ]);

  const { total, category } = getTotalAmount(bill);

  const Footer = h("div.footer", {}, [
    ...Object.keys(category)
      .sort((c1, c2) => category[c1] - category[c2])
      .map((key) => h("p", `${key}支出：${category[key]}`)),
    h("p", `总收入: ${total.income}`),
    h("p", `总支出: ${total.spending}`)
  ]);

  const vnode = h("div", [FilterHeader, TableContent, Footer]);

  // 更新page
  patch(el ? el : oldVode, vnode);
  // 保持上次vnode diff更新
  oldVode = vnode;
};

// 读取bill csv文件内容
const readBill = new Promise((resolve) => {
  Papa.parse("./bill.csv", {
    download: true,
    complete: function (results) {
      let csvArray = results.data;
      csvArray.shift();
      let data = csvArray.map((item) => {
        return {
          type: item[0],
          time: item[1],
          category: item[2],
          amount: item[3]
        };
      });
      resolve(data);
    }
  });
});

// 读取bcatetory csv文件内容
const readCategory = new Promise((resolve) => {
  Papa.parse("./categories.csv", {
    download: true,
    complete: function (results) {
      let csvArray = results.data;
      csvArray.shift();
      let data = csvArray.map((item) => {
        return {
          id: item[0],
          type: item[1],
          name: item[2]
        };
      });
      resolve(data);
    }
  });
});

Promise.all([readBill, readCategory]).then(([bill, categories]) => {
  rawBill = bill;
  rawCategory = categories;
  const container = document.getElementById("container");
  render(bill, container);
});
