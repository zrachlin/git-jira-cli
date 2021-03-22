const changeStatusString = (boardId, itemId, statusColumnId, status) => {
  return `mutation {
    change_simple_column_value (board_id: ${boardId}, item_id: ${itemId}, column_id: ${statusColumnId}, value: "${status}") {
    id
    }
    }`;
};

const getItemInfoString = itemId => {
  return `query {
    items (ids: ${itemId}) {
    name
    column_values {
      id
      value

    }
    }
    }`;
};

const getTagName = tagId => {
  return `query {
    tags (ids: ${tagId}) {
    name
    }
    }`;
};

module.exports = {
  changeStatusString,
  getItemInfoString,
  getTagName,
};
