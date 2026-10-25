package com.example.sample;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Formatting violations only (Spotless). Checkstyle should have nothing to say about this file. */
public class MessyOrderService
{

    private static final int MAX_ITEMS_PER_ORDER   =   50;
  private final Map<String,List<Integer>> ordersByCustomer=new HashMap<String,List<Integer>>();


    public MessyOrderService(){
    }

    public void addOrder(String customer,int itemCount)
    {
          if(itemCount>MAX_ITEMS_PER_ORDER)
          {
              throw new IllegalArgumentException("Too many items: "+itemCount);
          }
          else
          {
              List<Integer> orders=ordersByCustomer.get(customer);
              if(orders==null){orders=new ArrayList<Integer>();ordersByCustomer.put(customer,orders);}
              orders.add(itemCount);
          }
    }

    public int totalItems(String customer) {
        int total=0;
        for(int count:ordersByCustomer.getOrDefault(customer,new ArrayList<Integer>())){total+=count;}
        return total;
    }

    public int customerCount(){return ordersByCustomer.size();}

    public String label(String customer){
        return new StringBuilder()
                                   .append(customer)
                  .append(':')
            .append(totalItems(customer))
                .toString();
    }

    public String describe(String customer, int itemCount, boolean express, boolean giftWrap, String note, String couponCode, String region, String carrier) {
        return String.format("customer=%s, items=%d, express=%b, giftWrap=%b, note=%s, coupon=%s, region=%s, carrier=%s", customer, itemCount, express, giftWrap, note, couponCode, region, carrier);
    }

    public String banner(String customer, int itemCount, boolean express, boolean giftWrap, String note, String couponCode, String region) {
        // Over 160 columns: '+' chains are wrapped where necessary, operator at the end of the line, +4 continuation.
        return "customer=" + customer + ", items=" + itemCount + ", express=" + express + ", giftWrap=" + giftWrap + ", note=" + note + ", coupon=" + couponCode + ", region=" + region;
    }

    public void process(String customer) {
        try {
            addOrder(customer, 1);
        }
        catch (IllegalArgumentException e) {
            System.err.println("bad order");
        }
        finally {
            System.out.println("done");
        }
    }
}
