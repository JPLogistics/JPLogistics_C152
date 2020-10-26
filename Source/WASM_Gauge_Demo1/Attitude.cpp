// Copyright (c) Asobo Studio, All rights reserved. www.asobostudio.com

#include <MSFS\MSFS.h>
#include "MSFS\MSFS_Render.h"
#include "MSFS\Render\nanovg.h"
#include <MSFS\Legacy\gauges.h>

#include <stdio.h>
#include <string.h>
#include <math.h>

#ifdef _MSC_VER
#define snprintf _snprintf_s
#elif !defined(__MINGW32__)
#include <iconv.h>
#endif

struct sAttitudeVars
{
	NVGcontext* m_nvgctx = nullptr;
	ENUM m_eDegrees;
	ENUM m_eAttitudeIndicatorPitchDegrees;
	ENUM m_eAttitudeIndicatorBankDegrees;
	int m_iFont;
};

sAttitudeVars g_AttitudeVars;

// ------------------------
// Callbacks
extern "C" {

	MSFS_CALLBACK bool Attitude_gauge_callback(FsContext ctx, int service_id, void* pData)
	{
		switch (service_id)
		{
		case PANEL_SERVICE_PRE_INSTALL:
		{
			sGaugeInstallData* p_install_data = (sGaugeInstallData*)pData;
			// Width given in p_install_data->iSizeX
			// Height given in p_install_data->iSizeY
			g_AttitudeVars.m_eDegrees = get_units_enum("DEGREES");
			g_AttitudeVars.m_eAttitudeIndicatorPitchDegrees = get_aircraft_var_enum("ATTITUDE INDICATOR PITCH DEGREES");
			g_AttitudeVars.m_eAttitudeIndicatorBankDegrees = get_aircraft_var_enum("ATTITUDE INDICATOR BANK DEGREES");
			return true;
		}
		break;
		case PANEL_SERVICE_POST_INSTALL:
		{
			NVGparams params;
			params.userPtr = ctx;
			params.edgeAntiAlias = true;
			NVGcontext *nvgctx = nvgCreateInternal(&params);
			g_AttitudeVars.m_nvgctx = nvgctx;
			g_AttitudeVars.m_iFont = nvgCreateFont(nvgctx, "sans", "./data/Roboto-Regular.ttf");
			return true;
		}
		break;
		case PANEL_SERVICE_PRE_DRAW:
		{
			sGaugeDrawData* p_draw_data = (sGaugeDrawData*)pData;
			FLOAT64 fPitch = aircraft_varget(g_AttitudeVars.m_eAttitudeIndicatorPitchDegrees, g_AttitudeVars.m_eDegrees, 0);
			FLOAT64 fBank = aircraft_varget(g_AttitudeVars.m_eAttitudeIndicatorBankDegrees, g_AttitudeVars.m_eDegrees, 0);
			float fSize = sqrt(p_draw_data->winWidth * p_draw_data->winWidth + p_draw_data->winHeight * p_draw_data->winHeight) * 1.1f;
			float pxRatio = (float)p_draw_data->fbWidth / (float)p_draw_data->winWidth;
			NVGcontext* nvgctx = g_AttitudeVars.m_nvgctx;
			nvgBeginFrame(nvgctx, p_draw_data->winWidth, p_draw_data->winHeight, pxRatio);
			{
				// Center
				nvgTranslate(nvgctx, p_draw_data->winWidth * 0.5f, p_draw_data->winHeight * 0.5f);
				// Bank
				nvgRotate(nvgctx, fBank * M_PI / 180.0f);
				// Level
				float fH = fSize * 0.5f * (1.0f - sin(fPitch * M_PI / 180.0f));
				// Sky
				nvgFillColor(nvgctx, nvgRGB(0, 191, 255));
				nvgBeginPath(nvgctx);
				nvgRect(nvgctx, -fSize * 0.5f, -fSize * 0.5f, fSize, fH);
				nvgFill(nvgctx);
				// Ground
				nvgFillColor(nvgctx, nvgRGB(210, 105, 30));
				nvgBeginPath(nvgctx);
				nvgRect(nvgctx, -fSize * 0.5f, -fSize * 0.5f + fH, fSize, fSize - fH);
				nvgFill(nvgctx);
				// Indicator
				nvgResetTransform(nvgctx);
				nvgTranslate(nvgctx, p_draw_data->winWidth * 0.5f, p_draw_data->winHeight * 0.5f);
				nvgStrokeColor(nvgctx, nvgRGB(255, 255, 0));
				nvgStrokeWidth(nvgctx, 15.0f);
				nvgBeginPath(nvgctx);
				nvgMoveTo(nvgctx, -p_draw_data->winWidth * 0.2f, 0);
				nvgLineTo(nvgctx, -p_draw_data->winWidth * 0.05f, 0);
				nvgArc(nvgctx, 0, 0, p_draw_data->winWidth * 0.05f, M_PI, 0, NVG_CCW);
				nvgLineTo(nvgctx, p_draw_data->winWidth * 0.2f, 0);
				nvgStroke(nvgctx);
				// Circle
				nvgFillColor(nvgctx, nvgRGB(255, 255, 0));
				nvgBeginPath(nvgctx);
				nvgCircle(nvgctx, 0, 0, p_draw_data->winWidth * 0.01f);
				nvgFill(nvgctx);
			}
			nvgEndFrame(nvgctx);
			return true;
		}
		break;
		case PANEL_SERVICE_PRE_KILL:
		{
			NVGcontext* nvgctx = g_AttitudeVars.m_nvgctx;
			nvgDeleteInternal(nvgctx);
			return true;
		}
		break;
		}
		return false;
	}

}
