package com.edwarddergachev.iskraibolt;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override public void onCreate(Bundle b){ super.onCreate(b); getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON); hide(); }
  @Override public void onWindowFocusChanged(boolean f){ super.onWindowFocusChanged(f); if(f) hide(); }
  private void hide(){ getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY|View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN|View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_LAYOUT_STABLE); }
}
