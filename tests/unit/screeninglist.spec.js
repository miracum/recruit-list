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
  it("concatenates multiple given names", () => {
    const items = [
      {
        item: {
          resourceType: "ResearchSubject",
          individual: {
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
      },
    ];
    const wrapper = factory({ items });

    const firstNameRow = wrapper.find("td[data-label='Vorname']");
    expect(firstNameRow.text()).toMatch("A B C");
  });
});
