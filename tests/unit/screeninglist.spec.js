import { createLocalVue, mount } from "@vue/test-utils";
import Buefy from "buefy";
import ScreeningList from "@/components/ScreeningList.vue";

const factory = (values = {}) => {
  const localVue = createLocalVue();
  localVue.use(Buefy);
  return mount(ScreeningList, {
    localVue,
    stubs: ["router-link", "router-view"],
    propsData: {
      ...values,
    },
  });
};

describe("ScreeningList.vue", () => {
  it("displays gender and birthdate", () => {
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
            gender: "male",
            birthDate: "2000-01-01",
          },
        },
      },
    ];
    const wrapper = factory({ items });

    const genderColumn = wrapper.find("td[data-label='Geschlecht']");
    expect(genderColumn.text()).toMatch("männlich");

    const birthDateColumn = wrapper.find("td[data-label='Geburtsdatum']");
    expect(birthDateColumn.text()).toMatch("1.1.2000");
  });
});
