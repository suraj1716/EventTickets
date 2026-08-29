<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
class EventMediaSeeder extends Seeder
{
 public function run(): void
 {
  foreach(DB::table('events')->whereNull('deleted_at')->get() as $event) DB::table('event_media')->updateOrInsert(['event_id'=>$event->id,'position'=>0],['type'=>'image','path'=>'events/placeholders/event.jpg','mime_type'=>'image/jpeg','size'=>null,'updated_at'=>now(),'created_at'=>now()]);
 }
}
