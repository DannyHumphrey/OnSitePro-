export const K = {
  CreateQueue: "queue:create",
  Drafts: "drafts:index",
  Sent: "sent:index",
  IdMap: (tmpId: string) => `map:temp:${tmpId}`,
  InstanceMeta: (id: string | number) => `instance:meta:${id}`,
  InstanceData: (id: string | number) => `instance:data:${id}`,
  PatchQueue: (id: string | number) => `queue:form:${id}`,
};
