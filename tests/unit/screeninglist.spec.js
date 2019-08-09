import { createLocalVue, mount } from "@vue/test-utils";
import Buefy from "buefy";
import ScreeningList from "@/components/ScreeningList.vue";

const factory = (values = {}) => {
  const localVue = createLocalVue();
  localVue.use(Buefy);
  return mount(ScreeningList, {
    localVue,
    propsData: {
      ...values,
    },
  });
};

describe("ScreeningList.vue", () => {
  it("uses only the official name for display", () => {
    const items = [
      {
        item: {
          name: [
            {
              use: "old",
              family: "Old",
              given: ["Name"],
              prefix: ["Ms."],
            },
            {
              use: "official",
              family: "Boyer713",
              given: ["Candace369"],
              prefix: ["Ms."],
            },
          ],
        },
      },
    ];

    const wrapper = factory({ items });

    const firstNameRow = wrapper.find("td[data-label='Vorname']");
    expect(firstNameRow.text()).toBe("Candace369");

    const lastNameRow = wrapper.find("td[data-label='Nachname']");
    expect(lastNameRow.text()).toBe("Boyer713");
  });

  it("concatenates multiple given names", () => {
    const items = [
      {
        item: {
          name: [
            {
              use: "official",
              family: "Boyer713",
              given: ["A", "B", "C"],
              prefix: ["Ms."],
            },
          ],
        },
      },
    ];
    const wrapper = factory({ items });

    const firstNameRow = wrapper.find("td[data-label='Vorname']");
    expect(firstNameRow.text()).toBe("A B C");
  });
});
