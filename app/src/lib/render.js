const renderOrders = ($orders, orders = []) => {
  if(orders.length == 0) {
    $orders.html('<tr><td scope="row">No orders created yet...</td></tr>');
    return;
  }
  var html = orders.map((order) => {
    return(`<tr>
      <td>${order.id}</td>
      <td>${order.owner}</td>
      <td>${order.price}</td>
      <td>${order.volume}</td>
      <td>${order._type}</td>
     </tr>`);
   });
  $orders.html(html.join(''));
};

export {
  renderOrders
}