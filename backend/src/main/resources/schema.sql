create table if not exists orders (
  id bigserial primary key,
  created_at timestamptz not null default now(),

  customer_name varchar(255) not null,
  phone varchar(50) not null,
  address_line varchar(255) not null,
  city varchar(120) not null,
  zip varchar(30) not null,

  total double precision not null
);

create table if not exists order_items (
  id bigserial primary key,
  order_id bigint not null references orders(id) on delete cascade,

  product_id bigint not null,
  title varchar(255) not null,
  price double precision not null,
  image text not null,
  category varchar(120) not null,

  qty int not null,
  line_total double precision not null
);